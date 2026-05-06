"""Configuration management for AEM Form Sync."""

import base64
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import List, Optional

from dotenv import find_dotenv, load_dotenv

from .exceptions import ConfigurationError


class Environment(Enum):
    """Supported deployment environments."""

    LOCAL = "local"
    STAGE = "stage"
    PROD = "prod"


# Environment profile defaults.
# Explicit .env values ALWAYS override these defaults.
ENV_PROFILES = {
    Environment.LOCAL: {
        "ue_service_url": "https://universal-editor-service-stage.adobe.io",
        "client_id": "exc_app",
        "cloud_token_source": "static",  # requires UE_BEARER_TOKEN in .env
        "create_form_strategy": "sling_import",  # genai endpoint not available
        "auth_mechanism": "basic",  # expects AEM_USERNAME + AEM_PASSWORD
    },
    Environment.STAGE: {
        "ue_service_url": "https://universal-editor-service-stage.adobe.io",
        "client_id": "",  # fetched from AEM genai/token endpoint
        "cloud_token_source": "aem_genai",
        "create_form_strategy": "genai",
        "auth_mechanism": "token",  # expects AEM_TOKEN
    },
    Environment.PROD: {
        "ue_service_url": "https://universal-editor-service.adobe.io",
        "client_id": "",  # fetched from AEM genai/token endpoint
        "cloud_token_source": "aem_genai",
        "create_form_strategy": "genai",
        "auth_mechanism": "token",  # expects AEM_TOKEN
    },
}


@dataclass
class Config:
    """Configuration container for AEM Form Sync."""

    aem_host: str
    github_url: str
    env: Environment = Environment.STAGE
    push_allowlist: List[str] = field(default_factory=list)
    username: str = None
    password: str = None
    auth_token: str = None
    repo_dir: Path = field(default_factory=lambda: Path("./repo"))
    refs_dir: Path = field(default_factory=lambda: Path("./refs"))
    preview_path: Optional[str] = None
    github_branch: Optional[str] = None
    ue_service_url: str = "https://universal-editor-service-stage.adobe.io"
    ue_bearer_token: Optional[str] = None
    client_id: str = ""
    cloud_token_source: str = "aem_genai"
    create_form_strategy: str = "genai"

    @property
    def basic_auth_encoded(self) -> str:
        """Return base64 encoded credentials for Basic Auth."""
        if not self.username or not self.password:
            return None
        credentials = f"{self.username}:{self.password}"
        return base64.b64encode(credentials.encode()).decode()

    @property
    def basic_auth_header(self) -> str:
        """Return the Authorization header value.

        Uses AEM_TOKEN if provided, otherwise falls back to Basic Auth.
        """
        if self.auth_token:
            return f"Bearer {self.auth_token}"
        return f"Basic {self.basic_auth_encoded}"

    @property
    def github_owner(self) -> Optional[str]:
        """Extract owner from github_url (e.g., 'my-org' from 'https://github.com/my-org/my-repo')."""
        if not self.github_url:
            return None
        parts = self.github_url.rstrip("/").split("/")
        if len(parts) >= 2:
            return parts[-2]
        return None

    @property
    def github_repo(self) -> Optional[str]:
        """Extract repo from github_url (e.g., 'my-repo' from 'https://github.com/my-org/my-repo')."""
        if not self.github_url:
            return None
        parts = self.github_url.rstrip("/").split("/")
        if len(parts) >= 1:
            return parts[-1]
        return None

    def is_path_allowed(self, path: str) -> bool:
        """Check if a path is allowed for push operations.

        Args:
            path: The AEM path to check.

        Returns:
            True if the path starts with any of the allowed paths.
        """
        if not self.push_allowlist:
            return False
        # Normalize path to prevent traversal attacks (e.g., /allowed/../not-allowed)
        import posixpath

        normalized_path = posixpath.normpath(path)
        return any(
            normalized_path.startswith(allowed) for allowed in self.push_allowlist
        )

    def get_form_dir(self, form_path: str, no_edit: bool = False) -> Path:
        """
        Build the local directory path for a form based on its AEM path.

        Args:
            form_path: AEM form path (e.g., /content/forms/af/project/form)
            no_edit: If True, use refs_dir; otherwise use repo_dir

        Returns:
            Full local directory path (e.g., repo/content/forms/af/project/)
        """
        base_dir = self.refs_dir if no_edit else self.repo_dir
        # Strip leading slash from form_path and get parent directory
        relative_path = form_path.lstrip("/")
        parent_path = "/".join(relative_path.split("/")[:-1])  # Remove form name
        return base_dir / parent_path

    @property
    def is_local(self) -> bool:
        """True when running against a local AEM SDK."""
        return self.env == Environment.LOCAL

    @property
    def is_stage(self) -> bool:
        """True when running against AEM Cloud stage."""
        return self.env == Environment.STAGE

    @property
    def is_prod(self) -> bool:
        """True when running against AEM Cloud prod."""
        return self.env == Environment.PROD

    @classmethod
    def _parse_env(cls, raw: str) -> Environment:
        """Parse FORM_SYNC_ENV string into Environment enum.

        Args:
            raw: One of 'local', 'stage', 'prod' (case-insensitive).

        Returns:
            Environment enum member.

        Raises:
            ConfigurationError: If the value is not recognised.
        """
        try:
            return Environment(raw.strip().lower())
        except ValueError:
            valid = ", ".join(e.value for e in Environment)
            raise ConfigurationError(
                f"Invalid FORM_SYNC_ENV value: '{raw}'.\nValid values: {valid}"
            )

    @classmethod
    def from_env(cls, env_file: Path = None) -> "Config":
        """
        Load configuration from environment variables.

        Environment profiles (FORM_SYNC_ENV) supply defaults.
        Explicit .env values always override profile defaults.

        Args:
            env_file: Optional path to .env file. If not provided,
                     looks for .env in current directory.

        Returns:
            Config instance with loaded values.

        Raises:
            ConfigurationError: If required environment variables are missing.
        """
        # Load .env file if it exists
        if env_file:
            load_dotenv(env_file)
        else:
            # Look for .env in the user's current working directory
            cwd_env_path = Path.cwd() / ".env"
            if cwd_env_path.exists():
                load_dotenv(cwd_env_path)
            else:
                # Fallback: let python-dotenv search upward from cwd
                load_dotenv(dotenv_path=find_dotenv(usecwd=True))

        # ── Resolve environment profile ──────────────────────────
        env = cls._parse_env(os.getenv("FORM_SYNC_ENV", "prod"))
        profile = ENV_PROFILES[env]

        # Always required environment variables
        required_vars = {
            "AEM_HOST": "AEM Author URL (Cloud or local tunnel)",
            "GITHUB_URL": "GitHub URL for form template",
            "AEM_WRITE_PATHS": "Comma-separated list of allowed push paths",
        }

        # Check for missing required variables
        missing = []
        for var, description in required_vars.items():
            if not os.getenv(var):
                missing.append(f"  - {var}: {description}")

        if missing:
            raise ConfigurationError(
                "Missing required environment variables:\n"
                + "\n".join(missing)
                + "\n\nPlease set these in your .env file or environment."
            )

        # ── Authentication ──────────────────────────────────────
        auth_token = os.getenv("AEM_TOKEN")
        username = os.getenv("AEM_USERNAME")
        password = os.getenv("AEM_PASSWORD")

        has_token = bool(auth_token)
        has_credentials = bool(username and password)

        if profile["auth_mechanism"] == "basic":
            # Local mode: Basic Auth required
            if not has_credentials:
                raise ConfigurationError(
                    f"FORM_SYNC_ENV={env.value} requires Basic Auth.\n"
                    "Please provide AEM_USERNAME and AEM_PASSWORD in your .env file."
                )
        elif profile["auth_mechanism"] == "token":
            # Stage/Prod mode: prefer token, allow credentials as fallback
            if not has_token and not has_credentials:
                raise ConfigurationError(
                    f"FORM_SYNC_ENV={env.value} requires authentication.\n"
                    "Please provide one of the following:\n"
                    "  - AEM_TOKEN: Bearer token for AEM authentication\n"
                    "  OR\n"
                    "  - AEM_USERNAME and AEM_PASSWORD: Basic auth credentials\n"
                    "\nSet these in your .env file or environment."
                )
        else:
            # Fallback: any auth
            if not has_token and not has_credentials:
                raise ConfigurationError(
                    "Missing authentication credentials.\n"
                    "Please provide one of the following:\n"
                    "  - AEM_TOKEN: Bearer token for AEM authentication\n"
                    "  OR\n"
                    "  - AEM_USERNAME and AEM_PASSWORD: Basic auth credentials\n"
                    "\nSet these in your .env file or environment."
                )

        # Local mode with static cloud token source requires UE_BEARER_TOKEN
        ue_bearer_token = os.getenv("UE_BEARER_TOKEN")
        if profile["cloud_token_source"] == "static" and not ue_bearer_token:
            raise ConfigurationError(
                f"FORM_SYNC_ENV={env.value} requires UE_BEARER_TOKEN.\n"
                "The local AEM SDK does not have the genai/token endpoint.\n"
                "Please set UE_BEARER_TOKEN in your .env file."
            )

        # Strip trailing slash from host if present
        aem_host = os.getenv("AEM_HOST").rstrip("/")

        # Parse push allowlist
        allowlist_str = os.getenv("AEM_WRITE_PATHS", "")
        push_allowlist = [p.strip() for p in allowlist_str.split(",") if p.strip()]

        # Parse optional directory paths
        repo_dir = Path(os.getenv("FORM_SYNC_REPO_DIR", "./repo"))
        refs_dir = Path(os.getenv("FORM_SYNC_REFS_DIR", "./refs"))

        # Parse optional preview path
        preview_path = os.getenv("FORM_SYNC_PREVIEW_PATH")

        # Parse optional GitHub branch for Edge Delivery config
        github_branch = os.getenv("GITHUB_BRANCH")

        # ── UE configuration (explicit .env overrides profile defaults) ──
        ue_service_url = os.getenv("UE_SERVICE_URL", profile["ue_service_url"]).rstrip(
            "/"
        )

        # client_id: explicit .env override, then profile default
        client_id = os.getenv("FORM_SYNC_CLIENT_ID", profile["client_id"])

        return cls(
            aem_host=aem_host,
            github_url=os.getenv("GITHUB_URL"),
            env=env,
            push_allowlist=push_allowlist,
            username=username,
            password=password,
            auth_token=auth_token,
            repo_dir=repo_dir,
            refs_dir=refs_dir,
            preview_path=preview_path,
            github_branch=github_branch,
            ue_service_url=ue_service_url,
            ue_bearer_token=ue_bearer_token,
            client_id=client_id,
            cloud_token_source=profile["cloud_token_source"],
            create_form_strategy=profile["create_form_strategy"],
        )


# Metadata file name
METADATA_FILE = "metadata.json"


def get_working_dir() -> Path:
    """
    Get the current working directory where forms will be saved.

    Returns:
        Path to current working directory.
    """
    return Path.cwd()


def get_metadata_path() -> Path:
    """
    Get the path to the metadata.json file.

    Returns:
        Path to metadata.json in current working directory.
    """
    return get_working_dir() / METADATA_FILE
