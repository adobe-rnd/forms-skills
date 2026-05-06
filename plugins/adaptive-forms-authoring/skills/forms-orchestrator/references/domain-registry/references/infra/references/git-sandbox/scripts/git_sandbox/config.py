"""Configuration loading for git-sandbox."""

import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from dotenv import find_dotenv, load_dotenv

from .exceptions import ConfigurationError


@dataclass
class Config:
    """Configuration for git-sandbox."""

    repo: str
    branch: str
    allowed_paths: List[str]
    allowed_branches: List[str]
    workspace: Path = field(default_factory=lambda: Path("./workspace"))

    @classmethod
    def load(cls, path: Path = None, env_file: Path = None) -> "Config":
        """
        Load configuration from JSON file.

        Environment variables can be referenced in the config using:
        - ${VAR_NAME} or $VAR_NAME syntax

        Args:
            path: Path to config file (default: sandbox.json)
            env_file: Path to .env file (default: auto-discover)

        Returns:
            Config instance

        Raises:
            ConfigurationError: If config file not found or invalid
        """
        # Load environment variables
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

        # Find config file
        config_path = path or Path("sandbox.json")
        if not config_path.exists():
            raise ConfigurationError(
                f"Configuration file not found: {config_path}\n"
                "Create a sandbox.json file with your configuration."
            )

        # Load and parse JSON
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in {config_path}: {e}")

        # Expand environment variables in all string values
        data = cls._expand_env_vars(data)

        # Validate required fields
        required = ["repo", "branch"]
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            raise ConfigurationError(
                f"Missing required configuration fields: {', '.join(missing)}"
            )

        # Build config with defaults
        return cls(
            repo=data["repo"],
            branch=data["branch"],
            allowed_paths=data.get("allowed_paths", ["**"]),
            allowed_branches=data.get("allowed_branches", ["*"]),
            workspace=Path(data.get("workspace", "./workspace")),
        )

    @classmethod
    def _expand_env_vars(cls, obj):
        """
        Recursively expand environment variables in strings.

        Supports ${VAR_NAME} and $VAR_NAME syntax.
        """
        if isinstance(obj, str):
            return cls._expand_string(obj)
        elif isinstance(obj, dict):
            return {k: cls._expand_env_vars(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [cls._expand_env_vars(item) for item in obj]
        else:
            return obj

    @classmethod
    def _expand_string(cls, s: str) -> str:
        """Expand environment variables in a string."""
        # Match ${VAR_NAME} or $VAR_NAME (not followed by {)
        pattern = r"\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)"

        def replace(match):
            var_name = match.group(1) or match.group(2)
            value = os.getenv(var_name)
            if value is None:
                # Keep original if env var not set
                return match.group(0)
            return value

        return re.sub(pattern, replace, s)
