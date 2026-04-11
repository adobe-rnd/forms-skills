"""Component extraction and transformation for AEM Form Sync."""

from typing import Any


# Keys to remove when transforming component for push
KEYS_TO_REMOVE = {
    "jcr:lastModifiedBy",
    "jcr:primaryType",
    "jcr:createdBy",
    "jcr:lastModified",
    "jcr:created",
    "sling:resourceType",  # Used for resourceType, then removed from template
}


def extract_root_components(form_data: dict) -> list[tuple[str, dict]]:
    """
    Extract root-level components from form JSON.
    
    A component is any key-value pair where the value is a dict.
    
    Args:
        form_data: The form JSON data.
        
    Returns:
        List of (component_key, component_data) tuples.
    """
    return [(key, value) for key, value in form_data.items() if isinstance(value, dict)]


def get_component_resource_type(component_data: dict) -> str:
    """
    Get the sling:resourceType from a component.
    
    Args:
        component_data: The component data dict.
        
    Returns:
        The resource type string, or empty string if not found.
    """
    return component_data.get("sling:resourceType", "")


def get_component_field_type(component_data: dict) -> str:
    """
    Get the fieldType from a component.
    
    Args:
        component_data: The component data dict.
        
    Returns:
        The field type string, or empty string if not found.
    """
    return component_data.get("fieldType", "")


def get_component_name(component_data: dict) -> str:
    """
    Get the name from a component.
    
    Args:
        component_data: The component data dict.
        
    Returns:
        The name string, or empty string if not found.
    """
    return component_data.get("name", "")


def transform_component_for_push(component_key: str, component_data: dict) -> dict:
    """
    Transform a pulled component into Universal Editor content format.
    
    The transformation:
    - sling:resourceType becomes resourceType in xwalk.page
    - Keys in KEYS_TO_REMOVE are excluded from template
    - Everything else goes into template
    - The component_key becomes the name
    
    Args:
        component_key: The key of the component in the form JSON.
        component_data: The component data dict.
        
    Returns:
        Transformed content dict for Universal Editor /add API.
    """
    # Extract resourceType
    resource_type = component_data.get("sling:resourceType", "")
    
    # Build template (everything except removed keys)
    template = {k: v for k, v in component_data.items() if k not in KEYS_TO_REMOVE}
    
    return {
        "name": component_key,
        "xwalk": {
            "page": {
                "resourceType": resource_type,
                "template": template
            }
        }
    }


def build_add_component_payload(
    aem_host: str,
    form_path: str,
    component_key: str,
    component_data: dict,
) -> dict:
    """
    Build the full payload for Universal Editor /add API.
    
    Args:
        aem_host: AEM host URL.
        form_path: Path to the form (without .html).
        component_key: The key of the component.
        component_data: The component data dict.
        
    Returns:
        Full payload dict for the /add API.
    """
    content = transform_component_for_push(component_key, component_data)
    
    return {
        "connections": [
            {
                "name": "aemconnection",
                "protocol": "xwalk",
                "uri": aem_host
            }
        ],
        "target": {
            "container": {
                "resource": f"urn:aemconnection:{form_path}/jcr:content/root/section/form",
                "type": "container",
                "prop": ""
            }
        },
        "content": content
    }

