"""Validate operation for EDS Code Sync."""

import shutil
import tempfile
from pathlib import Path
from typing import Callable, Optional, Tuple

from .config import Config
from .exceptions import GitHubError
from .git_ops import GitOperations
from .mapper import FileMapper
from .push import _run_npm_command


def validate_code(
    config: Config,
    source_dir: Path,
    mapper: FileMapper = None,
    on_progress: Optional[Callable[[str], None]] = None,
) -> Tuple[bool, str]:
    """
    Validate local code changes against the EDS repository.

    Clones the repo, applies local changes, runs npm ci and npm run lint
    to verify that changes are valid before pushing.

    Args:
        config: Configuration object.
        source_dir: Local directory containing files to validate.
        mapper: Optional file mapper for reverse mapping.
        on_progress: Optional progress callback.

    Returns:
        Tuple of (passed, message).

    Raises:
        GitHubError: If validation operation fails.
    """

    def log(message: str) -> None:
        if on_progress:
            on_progress(message)

    # Initialize
    git_ops = GitOperations(config)
    mapper = mapper or FileMapper()

    # Create temp directory for clone
    temp_dir = Path(tempfile.mkdtemp(prefix="eds-validate-"))

    try:
        # Clone repository
        log(f"Cloning {config.github_repo} (branch: {config.github_branch})")
        repo_dir = git_ops.clone_repo(
            target_dir=temp_dir / "repo", branch=config.github_branch, on_progress=log
        )

        # Install dependencies (npm ci never modifies package-lock.json)
        log("Installing npm dependencies...")
        _run_npm_command(["npm", "ci"], repo_dir, on_progress=log)
        log("✓ Dependencies installed")

        # Apply local files to the cloned repo
        log(f"Applying local changes from: {source_dir}")
        from .push import _create_push_plan, _scan_local_files

        local_files = _scan_local_files(source_dir)
        push_plan = _create_push_plan(local_files, source_dir, mapper)
        log(f"Applying {len(push_plan)} files")

        if not push_plan:
            return True, "No files to validate. Check that files match mapping rules."

        for local_path, repo_path in push_plan.items():
            dest_file = repo_dir / repo_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(local_path, dest_file)

        # Run lint
        log("Running npm run lint...")
        try:
            _run_npm_command(["npm", "run", "lint"], repo_dir, on_progress=log)
            log("✓ Lint passed")
        except GitHubError as e:
            return False, f"Lint failed:\n{e}"

        return True, "All validations passed"

    finally:
        # Clean up temp directory
        log("Cleaning up...")
        git_ops.cleanup(temp_dir)
