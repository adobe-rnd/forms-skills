"""Sync operation for EDS Code Sync (git-based)."""

import shutil
import tempfile
from pathlib import Path
from typing import Optional, Callable, Tuple
from .config import Config
from .git_ops import GitOperations
from .mapper import FileMapper
from .exceptions import GitHubError


def sync_code(
    config: Config,
    mapper: FileMapper = None,
    on_progress: Optional[Callable[[str], None]] = None,
) -> Tuple[int, int]:
    """
    Sync code from GitHub repository to local directory using git clone.

    Args:
        config: Configuration object.
        mapper: Optional custom file mapper.
        on_progress: Optional progress callback.

    Returns:
        Tuple of (files_synced, files_skipped).

    Raises:
        GitHubError: If sync operation fails.
    """
    def log(message: str) -> None:
        if on_progress:
            on_progress(message)

    # Initialize
    git_ops = GitOperations(config)
    mapper = mapper or FileMapper()

    # Create temp directory for clone
    temp_dir = Path(tempfile.mkdtemp(prefix="eds-sync-"))

    try:
        # Clone repository
        log(f"Cloning {config.github_repo} (branch: {config.github_branch})")
        repo_dir = git_ops.clone_repo(
            target_dir=temp_dir / "repo",
            branch=config.github_branch,
            on_progress=log
        )

        # Get all files from repository
        log("Scanning repository files...")
        all_files = git_ops.get_repo_files(repo_dir)
        log(f"Found {len(all_files)} files in repository")

        # Create sync plan
        sync_plan = mapper.get_sync_plan(all_files)
        log(f"Planning to sync {len(sync_plan)} files")

        # Ensure target directory exists
        config.target_dir.mkdir(parents=True, exist_ok=True)

        # Sync files
        synced = 0
        skipped = 0

        for repo_path, local_path in sync_plan.items():
            try:
                log(f"Syncing {repo_path} -> {local_path}")

                # Source file in cloned repo
                source_file = repo_dir / repo_path

                if not source_file.exists():
                    log(f"  ⚠️  File not found: {repo_path}")
                    skipped += 1
                    continue

                # Destination file
                dest_file = config.target_dir / local_path
                dest_file.parent.mkdir(parents=True, exist_ok=True)

                # Copy file
                shutil.copy2(source_file, dest_file)
                synced += 1

            except Exception as e:
                log(f"  ⚠️  Failed to sync {repo_path}: {e}")
                skipped += 1

        return synced, skipped

    finally:
        # Clean up temp directory
        log("Cleaning up...")
        git_ops.cleanup(temp_dir)
