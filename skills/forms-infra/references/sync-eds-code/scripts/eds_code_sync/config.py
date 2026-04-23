"""Configuration management for EDS Code Sync."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import find_dotenv, load_dotenv

from .exceptions import ConfigurationError


@dataclass
class Config:
    """Configuration container for EDS Code Sync."""

    github_repo: str
    github_token: str
    github_branch: str
    target_dir: Path

    @classmethod
    def from_env(cls, env_file: Path = None, target_dir: str = None) -> "Config":
        """
        Load configuration from environment variables.

        Args:
            env_file: Optional path to .env file.
            target_dir: Target directory for synced code (defaults to ./code).

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

        # Required environment variables
        required_vars = {
            "GITHUB_REPO": "GitHub repository (e.g., owner/repo)",
            "GITHUB_TOKEN": "GitHub personal access token",
        }

        # Check for missing variables
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

        # Optional branch (defaults to main)
        branch = os.getenv("GITHUB_BRANCH", "main")

        # Target directory (defaults to ./code)
        target = Path(target_dir) if target_dir else Path.cwd() / "code"

        return cls(
            github_repo=os.getenv("GITHUB_REPO"),
            github_token=os.getenv("GITHUB_TOKEN"),
            github_branch=branch,
            target_dir=target,
        )
