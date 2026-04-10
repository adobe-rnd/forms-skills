"""Push operation for AEM Form Sync."""

import json
import time
from pathlib import Path
from typing import Optional

import requests

from .auth import AuthManager, CloudToken
from .client import AEMClient
from .components import build_add_component_payload, extract_root_components
from .config import Config, Environment, get_working_dir
from .exceptions import (
    ComponentAddError,
    FormCreationError,
    FormSyncError,
    PathNotAllowedError,
    VersionFileError,
)
from .metadata import (
    FormMetadata,
    MetadataManager,
    extract_form_name,
    get_form_key_from_filename,
)


def stringify_fd_json_objects(data: dict) -> dict:
    """
    Stringify JSON objects back to strings for keys starting with 'fd:'.

    This is the reverse of parse_fd_json_strings in pull.py.

    Args:
        data: Dictionary with parsed JSON objects in fd: keys.

    Returns:
        New dictionary with objects stringified back to JSON strings.
    """
    result = {}
    for key, value in data.items():
        if key.startswith("fd:"):
            # Stringify objects back to JSON strings
            if isinstance(value, list):
                stringified_list = []
                for item in value:
                    if isinstance(item, dict):
                        stringified_list.append(json.dumps(item))
                    else:
                        stringified_list.append(item)
                result[key] = stringified_list
            elif isinstance(value, dict):
                result[key] = json.dumps(value)
            else:
                result[key] = value
        else:
            result[key] = value
    return result


def restore_rules_to_component(component: dict, rules_store: dict) -> None:
    """
    Recursively traverse component and restore fd:rules and fd:events from refs.

    Modifies the component in-place, replacing {"ref": uuid} with actual content.
    Also stringifies the fd: prefixed keys back to JSON strings.

    Args:
        component: The component dictionary to process.
        rules_store: Dictionary of extracted rules keyed by UUID.
    """
    if not isinstance(component, dict):
        return

    # Check if fd:rules has a ref to restore
    if "fd:rules" in component:
        rules_data = component["fd:rules"]
        if isinstance(rules_data, dict) and "ref" in rules_data:
            rule_uuid = rules_data["ref"]
            if rule_uuid in rules_store:
                # Restore original fd:rules and stringify fd: keys
                original_rules = rules_store[rule_uuid].get("fd:rules", {})
                if isinstance(original_rules, dict):
                    original_rules = stringify_fd_json_objects(original_rules)
                component["fd:rules"] = original_rules

    # Check if fd:events has a ref to restore
    if "fd:events" in component:
        events_data = component["fd:events"]
        if isinstance(events_data, dict) and "ref" in events_data:
            rule_uuid = events_data["ref"]
            if rule_uuid in rules_store:
                # Restore original fd:events and stringify fd: keys
                original_events = rules_store[rule_uuid].get("fd:events", {})
                if isinstance(original_events, dict):
                    original_events = stringify_fd_json_objects(original_events)
                component["fd:events"] = original_events

    # Recursively process nested components
    for key, value in component.items():
        if isinstance(value, dict):
            restore_rules_to_component(value, rules_store)


def load_and_restore_rules(
    form_data: dict, form_metadata: FormMetadata, base_dir: Path
) -> None:
    """
    Load rules file and restore rules into form data.

    Args:
        form_data: The form JSON data (modified in-place).
        form_metadata: The form metadata containing local_rule_file path.
        base_dir: Base directory (repo or refs) for resolving relative paths.
    """
    # Use the localRuleFile from metadata if available
    if not form_metadata.local_rule_file:
        return  # No rules file specified in metadata

    rules_path = Path(form_metadata.local_rule_file)
    if not rules_path.is_absolute():
        rules_path = base_dir / rules_path

    if not rules_path.exists():
        return  # No rules file, nothing to restore

    with open(rules_path, "r", encoding="utf-8") as f:
        rules_store = json.load(f)

    restore_rules_to_component(form_data, rules_store)


def get_csrf_token(client: AEMClient) -> str:
    """
    Get CSRF token from AEM for form submissions.

    Args:
        client: AEM HTTP client.

    Returns:
        CSRF token string.

    Raises:
        FormSyncError: If token retrieval fails.
    """
    try:
        response = client.get("/libs/granite/csrf/token.json")
        data = response.json()
        return data.get("token", "")
    except Exception as e:
        raise FormSyncError(f"Failed to get CSRF token: {e}")


def get_config_path_from_form_path(form_path: str) -> str:
    """
    Convert form path to cloud configuration path.

    Args:
        form_path: Form path like /content/forms/af/forms-team/form/pl/etb-wo-v1

    Returns:
        Config path like /conf/forms/forms-team/form/pl/etb-wo-v1/settings/cloudconfigs/edge-delivery-service-configuration/_jcr_content
    """
    if form_path.startswith("/content/forms/af/"):
        relative_path = form_path[len("/content/forms/af/") :]
    else:
        relative_path = form_path.lstrip("/")

    return f"/conf/forms/{relative_path}/settings/cloudconfigs/edge-delivery-service-configuration/_jcr_content"


def update_edge_delivery_config(
    client: AEMClient,
    config: "Config",
    form_path: str,
    on_progress: Optional[callable] = None,
) -> dict:
    """
    Update the Edge Delivery Service configuration for a form with the GitHub branch.

    This sets the 'ref' (branch) in the form's cloud configuration to match
    the GITHUB_BRANCH environment variable.

    Args:
        client: AEM HTTP client.
        config: Configuration object with github_branch, github_owner, github_repo.
        form_path: Path to the form (e.g., /content/forms/af/forms-team/myform).
        on_progress: Optional callback for progress messages.

    Returns:
        dict with keys:
            success (bool): Whether the config was updated successfully.
            message (str): Description of what happened.
            remediation (str | None): Suggested fix if the update failed.
    """

    def log(message: str) -> None:
        if on_progress:
            on_progress(message)

    def result(success: bool, message: str, remediation: str = None) -> dict:
        return {"success": success, "message": message, "remediation": remediation}

    # Skip if no branch configured
    if not config.github_branch:
        msg = "GITHUB_BRANCH is not set in .env"
        log(f"Skipping Edge Delivery config update: {msg}")
        return result(
            False,
            msg,
            "Add GITHUB_BRANCH=main (or your branch name) to your workspace .env file and retry.",
        )

    owner = config.github_owner
    repo = config.github_repo

    if not owner or not repo:
        msg = "Could not parse owner/repo from GITHUB_URL"
        log(f"Skipping Edge Delivery config update: {msg}")
        return result(
            False,
            msg,
            "Set GITHUB_URL=https://github.com/<owner>/<repo> in your workspace .env file and retry.",
        )

    # Get CSRF token
    log("Getting CSRF token...")
    try:
        csrf_token = get_csrf_token(client)
    except Exception as e:
        msg = f"Failed to get CSRF token: {e}"
        log(msg)
        return result(
            False,
            msg,
            "Verify AEM_HOST and AEM_TOKEN (or AEM_USERNAME/AEM_PASSWORD) are correct in .env. "
            "The token may have expired — regenerate it from AEM Developer Console.",
        )

    # Build config path
    config_path = get_config_path_from_form_path(form_path)
    log(f"Updating Edge Delivery config at: {config_path}")

    # Build form data (URL-encoded)
    form_data = {
        "./owner": owner,
        "./repo": repo,
        "./ref": config.github_branch,
        "./edgeHost@Delete": "",
        "./edgeHost": "preview",
        "./projectType@Delete": "",
        "./projectType": "4",
        "./siteAuthToken": "",
        "./siteAuthToken@Encrypted": "",
        "./auxiliaryScripts": "module:scripts/editor-support.js",
        "./auxiliaryScripts@Delete": "",
        ":cq_csrf_token": csrf_token,
    }

    headers = {
        "Authorization": config.basic_auth_header,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "csrf-token": csrf_token,
        "X-Requested-With": "XMLHttpRequest",
    }

    try:
        url = f"{config.aem_host}{config_path}"
        response = requests.post(url, data=form_data, headers=headers)

        if not response.ok:
            msg = f"HTTP {response.status_code} from AEM at {config_path}"
            detail = response.text[:200] if response.text else "(no response body)"
            log(f"Warning: Edge Delivery config update failed — {msg}: {detail}")

            if response.status_code == 401:
                remediation = (
                    "Authentication failed. Regenerate your bearer token from AEM Developer Console "
                    "and update AEM_TOKEN in .env."
                )
            elif response.status_code == 403:
                remediation = (
                    f"Permission denied writing to {config_path}. "
                    "Ensure the AEM user has write access to /conf/forms/ and that "
                    "the form path is included in AEM_WRITE_PATHS in .env."
                )
            elif response.status_code == 404:
                remediation = (
                    f"Cloud config path not found: {config_path}. "
                    "The form may not have been created correctly on AEM, or the "
                    "cloud config node does not exist yet. Try re-creating the form."
                )
            else:
                remediation = (
                    f"AEM returned HTTP {response.status_code}. Check AEM logs for details. "
                    "Verify AEM_HOST is correct and the AEM instance is healthy."
                )

            return result(False, f"{msg} — {detail}", remediation)
        else:
            msg = (
                f"Edge Delivery config updated: branch set to '{config.github_branch}'"
            )
            log(msg)
            return result(True, msg)

    except requests.RequestException as e:
        msg = f"Network error updating Edge Delivery config: {e}"
        log(msg)
        return result(
            False,
            msg,
            "Check network connectivity to AEM_HOST. Verify the URL is correct and "
            "the AEM instance is reachable from your machine.",
        )


def create_empty_form(
    client: AEMClient,
    config: Config,
    form_title: str,
    folder_path: str,
) -> str:
    """
    Create an empty form on AEM.

    Args:
        client: AEM HTTP client.
        config: Configuration with GitHub URL.
        form_title: Title for the new form.
        folder_path: DAM folder path for the form.

    Returns:
        The URL path of the created form (e.g., /content/forms/af/myform-v1.html).

    Raises:
        FormCreationError: If form creation fails.
    """
    payload = {
        "queryType": "create_form",
        "result": {
            "formTitle": form_title,
            "formJson": '{"items": []}',
            "queryType": "create_form",
            "folderPath": folder_path,
            "templatePath": "/libs/fd/franklin/templates/page",
            "githubUrl": config.github_url,
        },
    }

    try:
        response = client.post("/adobe/forms/genaiaction/create_form", json=payload)
        data = response.json()

        # Extract the form URL from response
        form_url = data.get("result", {}).get("url", "")
        if not form_url:
            raise FormCreationError(
                f"Form creation response missing URL. Response: {data}"
            )

        return form_url

    except FormSyncError:
        raise
    except Exception as e:
        raise FormCreationError(f"Failed to create form: {e}")


def create_empty_fragment(
    client: AEMClient,
    config: Config,
    fragment_title: str,
    fragment_name: str,
    folder_path: str,
) -> str:
    """
    Create an empty fragment on AEM.

    Args:
        client: AEM HTTP client.
        config: Configuration with GitHub URL.
        fragment_title: Title for the new fragment.
        fragment_name: Name (slug) for the new fragment.
        folder_path: DAM folder path for the fragment.

    Returns:
        The path of the created fragment (e.g., /content/forms/af/team/fragments/my-fragment).

    Raises:
        FormCreationError: If fragment creation fails.
    """
    payload = {
        "githuburl": config.github_url,
        "title": fragment_title,
        "name": fragment_name,
        "templatePath": "/libs/fd/franklin/templates/fragment",
        "themePath": "",
        "folderPath": folder_path,
    }

    try:
        response = client.post("/adobe/forms/fm/v1/fragments", json=payload)
        data = response.json()

        # Extract the fragment path from response
        # The response format may vary - check for common patterns
        fragment_path = data.get("path", "") or data.get("fragmentPath", "")

        if not fragment_path:
            # Try to construct path from folder and name
            # Convert DAM path to forms path
            forms_folder = folder_path.replace(
                "/content/dam/formsanddocuments/", "/content/forms/af/"
            )
            fragment_path = f"{forms_folder}/{fragment_name}"

        return fragment_path

    except FormSyncError:
        raise
    except Exception as e:
        raise FormCreationError(f"Failed to create fragment: {e}")


def create_form_via_sling_import(
    client: AEMClient,
    config: Config,
    form_title: str,
    form_path: str,
    on_progress: Optional[callable] = None,
) -> str:
    """
    Create a form on local AEM SDK via Sling POST import API.

    This is the local-mode alternative to create_empty_form() which relies on
    the GenAI endpoint that is only available on AEM Cloud.

    Creates the full EDS Franklin page structure:
      cq:Page / jcr:content (page) / root (root) / section (section) / form (form)

    Args:
        client: AEM HTTP client.
        config: Configuration object.
        form_title: Title for the new form.
        form_path: Full AEM path (e.g., /content/forms/af/forms-team/myform).
        on_progress: Optional callback for progress messages.

    Returns:
        The path of the created form.

    Raises:
        FormCreationError: If form creation fails.
    """

    def log(message: str) -> None:
        if on_progress:
            on_progress(message)

    # Build the full JCR page structure with correct EDS Franklin resource types
    page_json = {
        "jcr:primaryType": "cq:Page",
        "jcr:content": {
            "jcr:primaryType": "cq:PageContent",
            "jcr:title": form_title,
            "sling:resourceType": "core/franklin/components/page/v1/page",
            "cq:template": "/libs/fd/franklin/templates/page",
            "jcr:language": "en",
            "author": "adobe",
            "sling:configRef": f"/conf/forms/{form_path.replace('/content/forms/af/', '')}/",
            "root": {
                "jcr:primaryType": "nt:unstructured",
                "sling:resourceType": "core/franklin/components/root/v1/root",
                "section": {
                    "jcr:primaryType": "nt:unstructured",
                    "sling:resourceType": "core/franklin/components/section/v1/section",
                    "form": {
                        "jcr:primaryType": "nt:unstructured",
                        "sling:resourceType": "fd/franklin/components/form/v1/form",
                        "fd:version": "2.1",
                        "fieldType": "form",
                        "jcr:title": form_title,
                        "name": form_title.lower().replace(" ", "-"),
                    },
                },
            },
        },
    }

    try:
        # Ensure parent folder exists
        parent_path = "/".join(form_path.rstrip("/").split("/")[:-1])
        log(f"Ensuring parent folder exists: {parent_path}")
        requests.post(
            f"{config.aem_host}{parent_path}",
            data={
                "jcr:primaryType": "sling:OrderedFolder",
                "jcr:title": parent_path.split("/")[-1],
            },
            headers={"Authorization": config.basic_auth_header},
        )

        # Import the page structure via Sling POST
        log(f"Creating form page at: {form_path}")
        response = requests.post(
            f"{config.aem_host}{form_path}",
            data={
                ":operation": "import",
                ":contentType": "json",
                ":content": json.dumps(page_json),
                ":replace": "true",
                ":replaceProperties": "true",
            },
            headers={"Authorization": config.basic_auth_header},
        )

        # AEM may return 409 for Sling import but still succeed
        if response.status_code not in (200, 201, 409):
            raise FormCreationError(
                f"Sling import failed: HTTP {response.status_code} - {response.text[:200]}"
            )

        log(f"Form page created at: {form_path}")
        return form_path

    except FormCreationError:
        raise
    except Exception as e:
        raise FormCreationError(f"Failed to create form via Sling import: {e}")


def get_form_path_from_url(form_url: str) -> str:
    """
    Extract form path from URL.

    Args:
        form_url: Form URL like /content/forms/af/myform.html

    Returns:
        Form path like /content/forms/af/myform
    """
    # Remove .html extension if present
    if form_url.endswith(".html"):
        return form_url[:-5]
    return form_url


def add_component_to_form(
    config: Config,
    cloud_token: CloudToken,
    form_path: str,
    component_key: str,
    component_data: dict,
) -> None:
    """
    Add a component to a form via Universal Editor API.

    Args:
        config: Configuration object.
        cloud_token: Cloud token for authentication.
        form_path: Path to the form (without .html).
        component_key: The key of the component.
        component_data: The component data dict.

    Raises:
        ComponentAddError: If adding the component fails.
    """
    # Build the payload
    payload = build_add_component_payload(
        aem_host=config.aem_host,
        form_path=form_path,
        component_key=component_key,
        component_data=component_data,
    )

    # Build headers
    headers = {
        "Authorization": f"Bearer {cloud_token.access_token}",
        "x-aemconnection-authorization": config.basic_auth_header,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            f"{config.ue_service_url}/add", json=payload, headers=headers
        )

        if not response.ok:
            raise ComponentAddError(
                f"Failed to add component '{component_key}': "
                f"HTTP {response.status_code} - {response.text[:200]}",
                component_name=component_key,
                form_path=form_path,
            )

    except requests.RequestException as e:
        raise ComponentAddError(
            f"Network error adding component '{component_key}': {e}",
            component_name=component_key,
            form_path=form_path,
        )


def patch_form_content(
    config: Config,
    cloud_token: CloudToken,
    form_path: str,
    form_data: dict,
) -> None:
    """
    Patch entire form content via Universal Editor API.

    Args:
        config: Configuration object.
        cloud_token: Cloud token for authentication.
        form_path: Path to the form (without .html).
        form_data: The complete form data dict to patch.

    Raises:
        FormSyncError: If patching the form fails.
    """
    # Build the payload for patch API
    payload = {
        "connections": [
            {
                "name": "aemconnection",
                "protocol": "xwalk",
                "uri": config.aem_host,
            }
        ],
        "patch": [
            {
                "op": "add",
                "path": "/form",
                "value": form_data,
            }
        ],
        "target": {
            "prop": "",
            "resource": f"urn:aemconnection:{form_path}/jcr:content/root/section",
            "type": "component",
        },
    }

    # Build headers
    headers = {
        "Authorization": f"Bearer {cloud_token.access_token}",
        "x-aemconnection-authorization": config.basic_auth_header,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            f"{config.ue_service_url}/patch", json=payload, headers=headers
        )

        if not response.ok:
            raise FormSyncError(
                f"Failed to patch form content: "
                f"HTTP {response.status_code} - {response.text[:200]}"
            )

    except requests.RequestException as e:
        raise FormSyncError(f"Network error patching form: {e}")


def get_form_details(
    config: Config,
    cloud_token: CloudToken,
    form_path: str,
) -> dict:
    """
    Get form details via Universal Editor API.

    Args:
        config: Configuration object.
        cloud_token: Cloud token for authentication.
        form_path: Path to the form (without .html).

    Returns:
        The form details data dict.

    Raises:
        FormSyncError: If getting form details fails.
    """
    # Build the payload for details API
    payload = {
        "connections": [
            {
                "name": "aemconnection",
                "protocol": "xwalk",
                "uri": config.aem_host,
            }
        ],
        "target": {
            "prop": "",
            "resource": f"urn:aemconnection:{form_path}/jcr:content/root/section/form",
            "type": "container",
        },
    }

    # Build headers
    headers = {
        "Authorization": f"Bearer {cloud_token.access_token}",
        "x-aemconnection-authorization": config.basic_auth_header,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            f"{config.ue_service_url}/details", json=payload, headers=headers
        )

        if not response.ok:
            raise FormSyncError(
                f"Failed to get form details: "
                f"HTTP {response.status_code} - {response.text[:200]}"
            )

        return response.json()

    except requests.RequestException as e:
        raise FormSyncError(f"Network error getting form details: {e}")


def extract_root_level_components(details_data: dict) -> list[str]:
    """
    Extract root-level component names from form details.

    A root-level component is any key in the 'data' dict whose value is a JSON object (dict),
    excluding form-level metadata keys (fd:*, jcr:*, sling:*).

    Args:
        details_data: The response from the details API.

    Returns:
        List of component names (keys) that are root-level components.
    """
    if "data" not in details_data:
        return []

    # Keys that are form-level metadata, NOT components to remove
    METADATA_PREFIXES = ("fd:", "jcr:", "sling:")
    METADATA_KEYS = {
        "fieldType",
        "title",
        "thankYouOption",
        "action",
        "dataRef",
        "customFunctionsPath",
        "schemaRef",
        "schemaType",
        "name",
    }

    data = details_data["data"]
    components = []

    for key, value in data.items():
        # Skip metadata keys - these are form properties, not components
        if key.startswith(METADATA_PREFIXES) or key in METADATA_KEYS:
            continue
        # Any remaining value that is a dict is considered a component
        if isinstance(value, dict):
            components.append(key)

    return components


def remove_component(
    config: Config,
    cloud_token: CloudToken,
    form_path: str,
    component_name: str,
) -> None:
    """
    Remove a component from a form via Universal Editor API.

    Args:
        config: Configuration object.
        cloud_token: Cloud token for authentication.
        form_path: Path to the form (without .html).
        component_name: Name of the component to remove.

    Raises:
        FormSyncError: If removing the component fails.
    """
    # Build the payload for remove API
    payload = {
        "connections": [
            {
                "name": "aemconnection",
                "protocol": "xwalk",
                "uri": config.aem_host,
            }
        ],
        "target": {
            "component": {
                "prop": "",
                "resource": f"urn:aemconnection:{form_path}/jcr:content/root/section/form/{component_name}",
                "type": "container",
            },
            "container": {
                "prop": "",
                "resource": f"urn:aemconnection:{form_path}/jcr:content/root/section/form",
                "type": "container",
            },
        },
    }

    # Build headers
    headers = {
        "Authorization": f"Bearer {cloud_token.access_token}",
        "x-aemconnection-authorization": config.basic_auth_header,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            f"{config.ue_service_url}/remove", json=payload, headers=headers
        )

        if not response.ok:
            raise FormSyncError(
                f"Failed to remove component '{component_name}': "
                f"HTTP {response.status_code} - {response.text[:200]}"
            )

    except requests.RequestException as e:
        raise FormSyncError(f"Network error removing component '{component_name}': {e}")


def clear_form_components(
    config: Config,
    cloud_token: CloudToken,
    form_path: str,
    on_progress: Optional[callable] = None,
) -> None:
    """
    Clear all root-level components from a form before updating it.

    Args:
        config: Configuration object.
        cloud_token: Cloud token for authentication.
        form_path: Path to the form (without .html).
        on_progress: Optional callback for progress messages.

    Raises:
        FormSyncError: If clearing components fails.
    """

    def log(message: str) -> None:
        if on_progress:
            on_progress(message)

    # Get current form details
    log("Getting form details...")
    details_data = get_form_details(config, cloud_token, form_path)

    # Extract root-level components
    components = extract_root_level_components(details_data)

    if not components:
        log("No components to remove")
        return

    log(
        f"Found {len(components)} root-level component(s) to remove: {', '.join(components)}"
    )

    # Remove each component
    for component_name in components:
        log(f"Removing component: {component_name}")
        remove_component(config, cloud_token, form_path, component_name)

    log("All components removed successfully")


def push_form(
    form_path: str,
    config: Config,
    source_file: Optional[str] = None,
    suffix: str = "-v1",
    force_new: bool = False,
    on_progress: Optional[callable] = None,
    preview_path: Optional[str] = None,
) -> tuple[str, bool]:
    """
    Push a local form to AEM.

    First push creates a new form with suffix and patches content.
    Subsequent pushes update the existing form via patch API.

    Args:
        form_path: Original AEM form path (e.g., /content/forms/af/myform).
        config: Configuration object.
        source_file: Optional path to source JSON file.
        suffix: Suffix to append to form name (default: -v1).
        force_new: Force creation of new form even if one exists.
        on_progress: Optional callback for progress messages.
        preview_path: Optional preview folder path (DAM path). When set, creates
            a new form at this path instead of updating existing form.

    Returns:
        Tuple of (AEM form path, is_new_form).

    Raises:
        PathNotAllowedError: If form path is not in the push allowlist.
        FormSyncError: If push operation fails.
    """

    def log(message: str) -> None:
        if on_progress:
            on_progress(message)

    # Initialize
    client = AEMClient(config)
    auth_manager = AuthManager(config, client)
    metadata_manager = MetadataManager()

    # Determine form key and load metadata
    form_name = extract_form_name(form_path)

    # Find the form in metadata
    form_key = _find_form_key(metadata_manager, form_path, form_name, source_file)
    form_metadata = metadata_manager.get_form(form_key)

    if form_metadata is None:
        raise VersionFileError(
            f"Form '{form_key}' not found in metadata.json. "
            "Please pull the form first using: form-sync pull {form_path}"
        )

    # Check if form is in refs location (read-only) - skip for preview mode
    if form_metadata.location == "refs" and not preview_path:
        raise FormSyncError(
            f"Cannot push form '{form_key}' - it's in refs directory (read-only).\n"
            f"Pull the form without --no-edit to sync an editable copy to repo."
        )

    # Check allowlist against the target path
    if preview_path:
        # For preview mode, check the preview path
        # preview_path is a DAM path like /content/dam/formsanddocuments/preview
        preview_forms_path = preview_path.replace(
            "/content/dam/formsanddocuments/", "/content/forms/af/"
        )
        client.check_path_allowed(preview_forms_path)
    else:
        # Convert DAM folder path to forms path for allowlist check
        dam_folder = form_metadata.folder_path
        forms_folder = dam_folder.replace(
            "/content/dam/formsanddocuments/", "/content/forms/af/"
        )
        client.check_path_allowed(forms_folder)

        # Also check currentPath if updating existing form
        if form_metadata.current_path:
            client.check_path_allowed(form_metadata.current_path)

    # Load the local form JSON
    # Determine base directory from form location
    base_dir = config.repo_dir if form_metadata.location == "repo" else config.refs_dir

    if source_file:
        # User-provided source file
        local_path = (
            Path(source_file)
            if Path(source_file).is_absolute()
            else get_working_dir() / source_file
        )
    else:
        # Use path from metadata (relative to base_dir)
        local_path = base_dir / form_metadata.local_file

    if not local_path.exists():
        raise FormSyncError(f"Local form file not found: {local_path}")

    with open(local_path, "r", encoding="utf-8") as f:
        form_data = json.load(f)

    # Restore rules from rule.json file before pushing
    # Rules file is in the same directory as the form file
    working_dir = local_path.parent
    load_and_restore_rules(form_data, form_metadata, base_dir)

    # Get cloud token for Universal Editor API
    log("Fetching cloud token...")
    cloud_token = auth_manager.get_cloud_token()
    log("Cloud token obtained")

    # Determine if we should update existing form or create new one
    # Preview mode always creates a new form at the preview path
    current_path = form_metadata.current_path
    is_new_form = False

    if preview_path:
        # Preview mode: always create a new form/fragment at preview path
        is_new_form = True

        # Create form title with suffix - use original form name from originalPath
        original_form_name = extract_form_name(form_metadata.original_path)
        form_title = f"{original_form_name}{suffix}"

        if form_metadata.fragment:
            log(f"Creating preview fragment: {form_title}")
            target_path = create_empty_fragment(
                client=client,
                config=config,
                fragment_title=form_title,
                fragment_name=form_title,
                folder_path=preview_path,
            )
            log(f"Created empty preview fragment: {target_path}")
        else:
            log(f"Creating preview form: {form_title}")
            form_url = create_empty_form(
                client=client,
                config=config,
                form_title=form_title,
                folder_path=preview_path,
            )
            target_path = get_form_path_from_url(form_url)
            log(f"Created empty preview form: {target_path}")

        # Wait for form/fragment to be ready before patching
        log("Waiting 2 seconds for form/fragment to be ready...")
        time.sleep(2)

        # Patch form content
        log("Patching form content...")
        patch_form_content(
            config=config,
            cloud_token=cloud_token,
            form_path=target_path,
            form_data=form_data,
        )
        log("Preview form/fragment content added successfully")

        # Note: Don't update metadata for preview forms/fragments
    elif current_path and not force_new:
        # Update existing form/fragment via patch API
        entity_type = "fragment" if form_metadata.fragment else "form"
        log(f"Updating existing {entity_type}: {current_path}")

        # Patch form content directly (no need to clear first - patch replaces)
        log(f"Patching {entity_type} with new content...")
        patch_form_content(
            config=config,
            cloud_token=cloud_token,
            form_path=current_path,
            form_data=form_data,
        )
        log(f"{entity_type.capitalize()} content updated successfully")
        target_path = current_path
    else:
        # Create new form or fragment
        is_new_form = True

        # Create form title with suffix - use original form name from originalPath
        original_form_name = extract_form_name(form_metadata.original_path)
        form_title = f"{original_form_name}{suffix}"

        if config.create_form_strategy == "sling_import":
            # Local mode: use Sling POST import (no GenAI endpoint)
            if form_metadata.fragment:
                log(f"Creating new fragment via Sling import: {form_title}")
                # For fragments, construct the target path from folder_path + name
                dam_folder = form_metadata.folder_path
                forms_folder = dam_folder.replace(
                    "/content/dam/formsanddocuments/", "/content/forms/af/"
                )
                target_path = f"{forms_folder}/{form_title}"
                # TODO: Sling import for fragments (similar structure, different template)
                raise FormCreationError(
                    "Fragment creation via Sling import is not yet implemented.\n"
                    "Create the fragment manually on AEM and set currentPath in metadata.json."
                )
            else:
                # Construct target path from original_path + suffix
                base_path = form_metadata.original_path.rstrip("/")
                target_path = f"{base_path}{suffix}"
                log(f"Creating new form via Sling import: {target_path}")
                target_path = create_form_via_sling_import(
                    client=client,
                    config=config,
                    form_title=form_title,
                    form_path=target_path,
                    on_progress=on_progress,
                )
                log(f"Created form via Sling import: {target_path}")
        else:
            # Stage/Prod: use GenAI endpoint
            if form_metadata.fragment:
                log(f"Creating new fragment: {form_title}")
                target_path = create_empty_fragment(
                    client=client,
                    config=config,
                    fragment_title=form_title,
                    fragment_name=form_title,
                    folder_path=form_metadata.folder_path,
                )
                log(f"Created empty fragment: {target_path}")
            else:
                log(f"Creating new form: {form_title}")
                form_url = create_empty_form(
                    client=client,
                    config=config,
                    form_title=form_title,
                    folder_path=form_metadata.folder_path,
                )
                target_path = get_form_path_from_url(form_url)
                log(f"Created empty form: {target_path}")

        # Wait for form/fragment to be ready before patching
        log("Waiting 2 seconds for form/fragment to be ready...")
        time.sleep(2)

        # Patch form content
        log("Patching form content...")
        patch_form_content(
            config=config,
            cloud_token=cloud_token,
            form_path=target_path,
            form_data=form_data,
        )
        log("Form/fragment content added successfully")

        # Update metadata with current path
        log("Updating metadata...")
        metadata_manager.set_current_path(form_key, target_path)

    # Update Edge Delivery config for new forms/fragments
    if is_new_form:
        log("Updating Edge Delivery configuration...")
        eds_config_result = update_edge_delivery_config(
            client, config, target_path, on_progress
        )
        if not eds_config_result["success"]:
            log(f"⚠ Edge Delivery config update failed: {eds_config_result['message']}")
            if eds_config_result.get("remediation"):
                log(f"  Remediation: {eds_config_result['remediation']}")

    return target_path, is_new_form


def _find_form_key(
    metadata_manager: MetadataManager,
    form_path: str,
    form_name: str,
    source_file: Optional[str],
) -> str:
    """
    Find the form key in metadata.

    Tries multiple strategies:
    1. If source_file provided, derive key from filename
    2. Search metadata for exact originalPath match

    Args:
        metadata_manager: Metadata manager instance.
        form_path: Original AEM form path.
        form_name: Extracted form name (unused, kept for compatibility).
        source_file: Optional source file path.

    Returns:
        Form key found in metadata.

    Raises:
        VersionFileError: If form not found.
    """
    # Strategy 1: Derive from source file
    if source_file:
        filename = Path(source_file).name
        key = get_form_key_from_filename(filename)
        if metadata_manager.get_form(key):
            return key

    # Strategy 2: Search by exact originalPath match
    metadata_path = metadata_manager.metadata_path
    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as f:
            all_metadata = json.load(f)

        for key, data in all_metadata.items():
            if isinstance(data, dict) and data.get("originalPath") == form_path:
                return key

    # Not found
    raise VersionFileError(
        f"Form not found in metadata.json for path: {form_path}\n"
        "Please pull the form first."
    )
