"""Git operations for EDS Code Sync."""

import shutil
import subprocess
from pathlib import Path
from typing import Callable, Optional

from .config import Config
from .exceptions import GitHubError


class GitOperations:
    """Handle git operations (clone, commit, push)."""

    def __init__(self, config: Config):
        """
        Initialize git operations.

        Args:
            config: Configuration with repo details.
        """
        self.config = config
        self.repo_url = self._build_repo_url()

    def _build_repo_url(self) -> str:
        """Build the git repository URL with authentication."""
        # Format: https://TOKEN@github.com/owner/repo.git
        return f"https://{self.config.github_token}@github.com/{self.config.github_repo}.git"

    def _run_git_command(
        self, command: list, cwd: Optional[Path] = None, check: bool = True
    ) -> subprocess.CompletedProcess:
        """
        Run a git command.

        Args:
            command: Command and arguments as list.
            cwd: Working directory for the command.
            check: Whether to raise exception on error.

        Returns:
            CompletedProcess result.

        Raises:
            GitHubError: If command fails and check=True.
        """
        try:
            result = subprocess.run(
                command, cwd=cwd, capture_output=True, text=True, check=check
            )
            return result
        except subprocess.CalledProcessError as e:
            raise GitHubError(
                f"Git command failed: {' '.join(command)}\nError: {e.stderr}"
            )

    def clone_repo(
        self,
        target_dir: Path,
        branch: Optional[str] = None,
        on_progress: Optional[Callable[[str], None]] = None,
    ) -> Path:
        """
        Clone the repository to target directory.

        Args:
            target_dir: Directory to clone into.
            branch: Optional specific branch to clone.
            on_progress: Progress callback.

        Returns:
            Path to cloned repository.

        Raises:
            GitHubError: If clone fails.
        """
        if on_progress:
            on_progress(f"Cloning {self.config.github_repo}...")

        # Remove target if it exists
        if target_dir.exists():
            shutil.rmtree(target_dir)

        # Build clone command
        cmd = ["git", "clone"]
        if branch:
            cmd.extend(["-b", branch])
        cmd.extend(["--depth", "1"])  # Shallow clone for speed
        cmd.extend([self.repo_url, str(target_dir)])

        self._run_git_command(cmd)

        if on_progress:
            on_progress(f"✓ Repository cloned")

        return target_dir

    def create_branch(
        self, repo_dir: Path, branch_name: str, base_branch: Optional[str] = None
    ) -> None:
        """
        Create a new branch in the repository.

        Args:
            repo_dir: Repository directory.
            branch_name: Name for new branch.
            base_branch: Base branch to create from (default: current).

        Raises:
            GitHubError: If branch creation fails.
        """
        if base_branch:
            self._run_git_command(["git", "checkout", base_branch], cwd=repo_dir)

        self._run_git_command(["git", "checkout", "-b", branch_name], cwd=repo_dir)

    def commit_changes(
        self,
        repo_dir: Path,
        commit_message: str,
        on_progress: Optional[Callable[[str], None]] = None,
    ) -> bool:
        """
        Stage and commit all changes.

        Args:
            repo_dir: Repository directory.
            commit_message: Commit message.
            on_progress: Progress callback.

        Returns:
            True if changes were committed, False if no changes.

        Raises:
            GitHubError: If commit fails.
        """
        # Stage all changes
        self._run_git_command(["git", "add", "-A"], cwd=repo_dir)

        # Check if there are changes to commit
        result = self._run_git_command(
            ["git", "diff", "--cached", "--quiet"], cwd=repo_dir, check=False
        )

        if result.returncode == 0:
            # No changes
            return False

        # Commit changes
        if on_progress:
            on_progress("Creating commit...")

        self._run_git_command(["git", "commit", "-m", commit_message], cwd=repo_dir)

        if on_progress:
            on_progress("✓ Changes committed")

        return True

    def push_branch(
        self,
        repo_dir: Path,
        branch_name: str,
        on_progress: Optional[Callable[[str], None]] = None,
    ) -> None:
        """
        Push branch to remote.

        Args:
            repo_dir: Repository directory.
            branch_name: Branch to push.
            on_progress: Progress callback.

        Raises:
            GitHubError: If push fails.
        """
        if on_progress:
            on_progress(f"Pushing branch {branch_name}...")

        self._run_git_command(
            ["git", "push", "-u", "origin", branch_name], cwd=repo_dir
        )

        if on_progress:
            on_progress(f"✓ Branch pushed")

    def get_repo_files(self, repo_dir: Path, base_path: str = "") -> list:
        """
        Get list of files in repository.

        Args:
            repo_dir: Repository directory.
            base_path: Base path to list files from.

        Returns:
            List of file paths relative to repo root.
        """
        search_dir = repo_dir / base_path if base_path else repo_dir
        files = []

        for item in search_dir.rglob("*"):
            if item.is_file() and ".git" not in item.parts:
                # Get path relative to repo root
                rel_path = item.relative_to(repo_dir)
                files.append(str(rel_path))

        return files

    def cleanup(self, repo_dir: Path) -> None:
        """
        Clean up cloned repository.

        Args:
            repo_dir: Repository directory to remove.
        """
        if repo_dir.exists():
            shutil.rmtree(repo_dir)
