"""File mapping logic for EDS Code Sync."""

from pathlib import Path
from typing import Dict, List, Tuple
import json


class FileMapper:
    """Maps GitHub repository files to local directory structure."""

    # Default mapping configuration
    DEFAULT_MAPPING = {
        "blocks/form/form.js": "forms.js",
        "blocks/form/form.css": "forms.css",
        "blocks/form/components/": "components/",
        "blocks/form/mappings.js": "mappings.js",
        "blocks/form/_form.json": "authoring/_form.json",
        "models/_component-definition.json": "authoring/_component-definition.json",
        "component-definition.json": "authoring/component-definition.json",
        "component-filters.json": "authoring/component-filters.json",
        "component-models.json": "authoring/component-models.json",
        "blocks/form/functions.js" : "functions.js",
        "blocks/form/models/form-components/" : "authoring/models/form-components/",
    }

    def __init__(self, custom_mapping: Dict[str, str] = None):
        """
        Initialize the file mapper.

        Args:
            custom_mapping: Optional custom mapping configuration.
        """
        self.mapping = custom_mapping or self.DEFAULT_MAPPING

    @classmethod
    def from_file(cls, mapping_file: Path) -> "FileMapper":
        """
        Load mapping from a JSON file.

        Args:
            mapping_file: Path to mapping configuration JSON file.

        Returns:
            FileMapper instance.
        """
        with open(mapping_file, "r", encoding="utf-8") as f:
            mapping = json.load(f)
        return cls(custom_mapping=mapping)

    def map_path(self, repo_path: str) -> Tuple[bool, str]:
        """
        Map a repository path to a local path.

        Args:
            repo_path: Path in the repository.

        Returns:
            Tuple of (should_sync, local_path).
            should_sync is False if file should be ignored.

        Examples:
            "blocks/form/form.js" -> (True, "forms.js")
            "blocks/form/components/text-input.js" -> (True, "components/text-input.js")
            "README.md" -> (False, "")
        """
        for repo_pattern, local_pattern in self.mapping.items():
            # Exact file match
            if repo_pattern == repo_path:
                return True, local_pattern

            # Directory mapping (pattern ends with /)
            if repo_pattern.endswith("/") and repo_path.startswith(repo_pattern):
                # Extract the relative path after the pattern
                relative = repo_path[len(repo_pattern):]

                # General directory mapping: preserve relative structure
                # blocks/form/components/text-input.js -> components/text-input.js
                local_path = f"{local_pattern}{relative}"
                return True, local_path

        return False, ""

    def get_sync_plan(self, repo_files: List[str]) -> Dict[str, str]:
        """
        Create a sync plan for a list of repository files.

        Args:
            repo_files: List of file paths from repository.

        Returns:
            Dictionary mapping repo_path -> local_path for files to sync.
        """
        sync_plan = {}
        for repo_path in repo_files:
            should_sync, local_path = self.map_path(repo_path)
            if should_sync:
                sync_plan[repo_path] = local_path
        return sync_plan

