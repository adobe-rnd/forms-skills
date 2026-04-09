"""Metadata file management for AEM Form Sync."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .config import METADATA_FILE, get_metadata_path, get_working_dir
from .exceptions import VersionFileError


class FormMetadata:
    """Represents metadata for a single form or fragment."""

    def __init__(
        self,
        folder_path: str,
        original_path: str,
        local_file: str,
        current_path: str = None,
        local_rule_file: str = None,
        location: str = "repo",
        fragment: bool = False,
    ):
        self.folder_path = folder_path
        self.original_path = original_path
        self.local_file = local_file
        self.current_path = current_path
        self.local_rule_file = local_rule_file
        self.location = location  # "repo" or "refs"
        self.fragment = fragment  # True if this is a fragment

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        result = {
            "folderPath": self.folder_path,
            "originalPath": self.original_path,
            "localFile": self.local_file,
            "location": self.location,
        }
        if self.current_path:
            result["currentPath"] = self.current_path
        if self.local_rule_file:
            result["localRuleFile"] = self.local_rule_file
        # Only include fragment key if it's a fragment (backward compatibility)
        if self.fragment:
            result["fragment"] = True
        return result

    @classmethod
    def from_dict(cls, data: dict) -> "FormMetadata":
        """Create from dictionary."""
        return cls(
            folder_path=data.get("folderPath", ""),
            original_path=data.get("originalPath", ""),
            local_file=data.get("localFile", ""),
            current_path=data.get("currentPath"),
            local_rule_file=data.get("localRuleFile"),
            location=data.get("location", "repo"),
            fragment=data.get("fragment", False),
        )


class MetadataManager:
    """Manages the centralized metadata.json file."""

    def __init__(self, metadata_dir: Optional[Path] = None):
        """
        Initialize the metadata manager.
        
        Args:
            metadata_dir: Optional directory where metadata.json should be stored.
                         If None, uses current working directory.
        """
        if metadata_dir:
            self.metadata_path = metadata_dir / METADATA_FILE
        else:
            self.metadata_path = get_metadata_path()
        self._data: dict = {}
        self._load()

    def _load(self) -> None:
        """Load metadata from file, creating empty dict if doesn't exist."""
        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except json.JSONDecodeError as e:
                raise VersionFileError(f"Invalid metadata.json format: {e}")
        else:
            self._data = {}

    def _save(self) -> None:
        """Save metadata to file."""
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2)

    def get_form(self, form_key: str) -> Optional[FormMetadata]:
        """
        Get metadata for a form by its key.

        Args:
            form_key: The form key (used as key in metadata.json).

        Returns:
            FormMetadata if found, None otherwise.
        """
        if form_key in self._data:
            data = self._data[form_key]
            # Only return FormMetadata if the value is a dict with form metadata structure
            if isinstance(data, dict) and "originalPath" in data:
                return FormMetadata.from_dict(data)
        return None

    def set_form(self, form_key: str, metadata: FormMetadata) -> None:
        """
        Set metadata for a form.

        Args:
            form_key: The form key.
            metadata: FormMetadata instance.
        """
        self._data[form_key] = metadata.to_dict()
        self._save()

    def set_current_path(self, form_key: str, current_path: str) -> None:
        """
        Set the current path for a form after push.

        Args:
            form_key: The form key.
            current_path: The AEM path where the form is pushed.
        """
        form = self.get_form(form_key)
        if form is None:
            raise VersionFileError(f"Form '{form_key}' not found in metadata.")

        form.current_path = current_path
        self.set_form(form_key, form)


def extract_form_name(form_path: str) -> str:
    """
    Extract form name from AEM path.

    Args:
        form_path: Full AEM path (e.g., /content/forms/af/acroform)

    Returns:
        Form name (last segment of path).
    """
    return form_path.rstrip("/").split("/")[-1]


def extract_folder_name(form_path: str) -> str:
    """
    Extract folder name from AEM path.

    Args:
        form_path: Full AEM path (e.g., /content/forms/af/myFolder/acroform)

    Returns:
        Folder name (second-to-last segment, or 'af' if at root).
    """
    parts = form_path.rstrip("/").split("/")
    if len(parts) >= 2:
        return parts[-2]
    return "af"


def extract_folder_path(form_path: str) -> str:
    """
    Extract the DAM folder path from a form path.

    Converts /content/forms/af/... to /content/dam/formsanddocuments/...

    Args:
        form_path: Full AEM form path.

    Returns:
        Corresponding DAM folder path.
    """
    # Remove form name to get parent path
    parts = form_path.rstrip("/").split("/")
    parent_parts = parts[:-1]  # Remove last segment (form name)

    # Convert /content/forms/af/... to /content/dam/formsanddocuments/...
    if len(parent_parts) >= 4 and parent_parts[:4] == ["", "content", "forms", "af"]:
        remaining = parent_parts[4:]  # Parts after /content/forms/af
        if remaining:
            return "/content/dam/formsanddocuments/" + "/".join(remaining)
        return "/content/dam/formsanddocuments"

    # Fallback: just return the parent path as-is
    return "/".join(parent_parts)


def determine_local_filename(form_path: str) -> str:
    """
    Determine the local filename for a form, handling collisions.

    Args:
        form_path: Full AEM form path.

    Returns:
        Local filename (e.g., 'acroform.form.json' or 'myFolder_acroform.form.json').
    """
    form_name = extract_form_name(form_path)
    simple_filename = f"{form_name}.form.json"

    # Check if simple filename already exists
    working_dir = get_working_dir()
    if not (working_dir / simple_filename).exists():
        return simple_filename

    # Use folder prefix
    folder_name = extract_folder_name(form_path)
    return f"{folder_name}_{form_name}.form.json"


def get_form_key_from_filename(filename: str) -> str:
    """
    Extract form key from local filename.

    Args:
        filename: Local filename (e.g., 'acroform.form.json').

    Returns:
        Form key (e.g., 'acroform').
    """
    # Remove .form.json extension
    if filename.endswith(".form.json"):
        return filename[:-10]
    return filename

