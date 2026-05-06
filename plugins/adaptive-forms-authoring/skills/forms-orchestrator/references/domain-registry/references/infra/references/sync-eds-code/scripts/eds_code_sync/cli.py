"""CLI entry point for EDS Code Sync."""

import sys
from pathlib import Path

import click

from . import __version__
from .config import Config
from .exceptions import EDSCodeSyncError
from .mapper import FileMapper
from .sync import sync_code


@click.group()
@click.version_option(version=__version__, prog_name="eds-code-sync")
def cli():
    """EDS Code Sync - Pull EDS Forms code from GitHub to local workspace.

    \b
    Examples:
        eds-code-sync sync
        eds-code-sync sync --target ./my-code --verbose
    """
    pass


@cli.command()
@click.option(
    "--target",
    "-t",
    default=None,
    help="Target directory for synced code (default: ./code)",
)
@click.option(
    "--mapping",
    "-m",
    default=None,
    type=click.Path(exists=True, path_type=Path),
    help="Custom mapping configuration JSON file",
)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
def sync(target: str, mapping: Path, verbose: bool):
    """Sync EDS Forms code from GitHub to local directory.

    \b
    This command clones the GitHub repository and copies files
    based on mapping rules to your local code/ directory.

    \b
    Examples:
        eds-code-sync sync
        eds-code-sync sync --target ./sandbox/code
        eds-code-sync sync --mapping ./my-mapping.json --verbose
    """
    try:
        # Load configuration
        click.echo("Loading configuration...")
        config = Config.from_env(target_dir=target)

        if verbose:
            click.echo(f"  Repository: {config.github_repo}")
            click.echo(f"  Branch: {config.github_branch}")
            click.echo(f"  Target: {config.target_dir}")

        # Load mapper
        if mapping:
            click.echo(f"Loading custom mapping from {mapping}")
            mapper = FileMapper.from_file(mapping)
        else:
            mapper = FileMapper()

        # Show active mapping rules if verbose
        if verbose:
            click.echo()
            click.secho("Active Mapping Rules:", fg="cyan", bold=True)
            for repo_pattern, local_pattern in mapper.mapping.items():
                click.echo(f"  {repo_pattern} → {local_pattern}")
            click.echo()

        # Create progress callback
        def on_progress(message: str) -> None:
            if verbose:
                click.echo(f"  {message}")

        # Perform sync
        click.echo("Syncing code from GitHub...")
        synced, skipped = sync_code(config, mapper, on_progress if verbose else None)

        # Success output
        click.echo(f"✓ Synced {synced} files to {config.target_dir}")
        if skipped > 0:
            click.echo(f"⚠️  Skipped {skipped} files due to errors")

        click.secho("SUCCESS: Code sync completed", fg="green")

    except EDSCodeSyncError as e:
        click.secho(f"ERROR: {e}", fg="red", err=True)
        sys.exit(1)
    except Exception as e:
        if verbose:
            import traceback

            click.secho(
                f"UNEXPECTED ERROR: {e}\n{traceback.format_exc()}",
                fg="red",
                err=True,
            )
        else:
            click.secho(f"UNEXPECTED ERROR: {e}", fg="red", err=True)
        sys.exit(1)


@cli.command()
def test():
    """Test GitHub token and repository access.

    \b
    This command verifies:
    - Your GitHub token is valid
    - You have access to the repository
    - The repository exists and is accessible

    \b
    Example:
        eds-code-sync test
    """
    try:
        # Load configuration
        click.echo("Loading configuration...")
        config = Config.from_env()

        click.echo(f"Testing token: {config.github_token[:10]}...")
        click.echo(f"Testing access to: {config.github_repo}")
        click.echo()

        # Import here to avoid loading if not needed
        from github import GithubException

        from .github_client import GitHubClient

        client = GitHubClient(config)

        # Test token by getting authenticated user
        click.echo("Checking token validity...")
        try:
            user = client.github.get_user()
            click.secho(f"✅ Token is valid!", fg="green")
            click.echo(f"   Authenticated as: {user.login}")
            if user.name:
                click.echo(f"   Name: {user.name}")
            click.echo()
        except GithubException as e:
            if e.status == 401:
                click.secho(f"❌ Authentication failed!", fg="red", bold=True)
                click.echo(f"   Your token is invalid, expired, or revoked.")
                click.echo()
                click.echo("To fix this:")
                click.echo("  1. Go to: https://github.com/settings/tokens")
                click.echo("  2. Generate a new token (classic)")
                click.echo("  3. Select 'repo' scope")
                click.echo("  4. Update your .env file with the new token")
                sys.exit(1)
            else:
                raise

        # Test repository access
        click.echo(f"Testing repository access to {config.github_repo}...")
        try:
            repo = client.get_repo()
            click.secho(f"✅ Repository access granted!", fg="green")
            click.echo(f"   Repo: {repo.full_name}")
            if repo.description:
                click.echo(f"   Description: {repo.description}")
            click.echo(f"   Private: {repo.private}")
            click.echo(f"   Default branch: {repo.default_branch}")
            click.echo()
        except GithubException as e:
            if e.status == 404:
                click.secho(f"❌ Repository not found!", fg="red", bold=True)
                click.echo(
                    f"   Either the repository doesn't exist or you don't have access."
                )
                click.echo()
                click.echo("Possible issues:")
                click.echo(f"  • Repository name might be wrong: {config.github_repo}")
                click.echo(
                    f"  • Repository might be private and your token lacks access"
                )
                click.echo(
                    f"  • Token might not have 'repo' scope for private repositories"
                )
                sys.exit(1)
            elif e.status == 403:
                click.secho(f"❌ Access forbidden!", fg="red", bold=True)
                click.echo(
                    f"   Your token doesn't have permission to access this repository."
                )
                click.echo()
                click.echo("To fix this:")
                click.echo("  1. Go to: https://github.com/settings/tokens")
                click.echo(
                    "  2. Make sure your token has 'repo' scope (for private repos)"
                )
                click.echo("  3. Or use 'public_repo' scope (for public repos only)")
                sys.exit(1)
            else:
                raise

        # Check rate limit
        try:
            rate_limit = client.github.get_rate_limit()
            # Try different ways to access rate limit depending on PyGithub version
            if hasattr(rate_limit, "core"):
                remaining = rate_limit.core.remaining
                limit = rate_limit.core.limit
            elif hasattr(rate_limit, "rate"):
                remaining = rate_limit.rate.remaining
                limit = rate_limit.rate.limit
            else:
                remaining = "?"
                limit = "?"
            click.echo(f"Rate limit: {remaining}/{limit} requests remaining")
        except Exception:
            # Rate limit check is not critical, skip if it fails
            click.echo("Rate limit: Unable to check (not critical)")

        click.echo()
        click.secho(
            "🎉 Everything looks good! You're ready to sync.", fg="green", bold=True
        )

    except EDSCodeSyncError as e:
        click.secho(f"❌ ERROR: {e}", fg="red", err=True)
        click.echo()
        click.echo("Troubleshooting tips:")
        click.echo("  1. Check your token at: https://github.com/settings/tokens")
        click.echo("  2. Make sure the token has 'repo' scope")
        click.echo("  3. Verify the repository name is correct (owner/repo)")
        sys.exit(1)
    except Exception as e:
        click.secho(f"❌ UNEXPECTED ERROR: {e}", fg="red", err=True)
        click.echo()
        click.echo("This might be a network issue or API problem.")
        click.echo("Try again in a moment.")
        sys.exit(1)


@cli.command()
@click.option(
    "--mapping",
    "-m",
    default=None,
    type=click.Path(exists=True, path_type=Path),
    help="Show custom mapping from JSON file",
)
def show_mapping(mapping: Path):
    """Show the active file mapping rules.

    \b
    This displays which repository files will be synced
    and where they will be saved locally.

    \b
    Examples:
        eds-code-sync show-mapping
        eds-code-sync show-mapping --mapping ./custom.json
    """
    try:
        # Load mapper
        if mapping:
            click.echo(f"Loading custom mapping from {mapping}")
            click.echo()
            mapper = FileMapper.from_file(mapping)
            mapping_source = f"Custom mapping from {mapping}"
        else:
            mapper = FileMapper()
            mapping_source = "Default mapping (built-in)"

        click.secho(mapping_source, fg="cyan", bold=True)
        click.echo()

        click.echo("File Mapping Rules:")
        click.echo("─" * 60)

        for repo_pattern, local_pattern in mapper.mapping.items():
            click.echo(f"  {repo_pattern}")
            click.secho(f"    → {local_pattern}", fg="green")

        click.echo("─" * 60)
        click.echo()

        # Explain patterns
        click.echo("Pattern Types:")
        click.echo("  • Exact match: Syncs only the specified file")
        click.echo("  • Directory (ends with /): Syncs matching files from directory")
        click.echo()

        click.echo("Example Matches:")
        click.echo("  scripts/form.js")
        click.echo(f"    → ./code/form.js")
        click.echo("  blocks/text-input/text-input.js")
        click.echo(f"    → ./code/components/text-input.js")
        click.echo()

        click.echo("To see actual files that will sync, run:")
        click.secho("  eds-code-sync sync --dry-run", fg="yellow")

    except Exception as e:
        click.secho(f"ERROR: {e}", fg="red", err=True)
        sys.exit(1)


@cli.command()
@click.option(
    "--source",
    "-s",
    default="./code",
    type=click.Path(exists=True, path_type=Path),
    help="Source directory containing files to push (default: ./code)",
)
@click.option(
    "--branch",
    "-b",
    required=True,
    help="Name for the new branch (required)",
)
@click.option(
    "--message",
    "-m",
    default=None,
    help="Commit message (default: auto-generated)",
)
@click.option(
    "--pr",
    is_flag=True,
    help="Create a pull request after pushing",
)
@click.option(
    "--mapping",
    default=None,
    type=click.Path(exists=True, path_type=Path),
    help="Custom mapping configuration JSON file",
)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
def push(
    source: Path, branch: str, message: str, pr: bool, mapping: Path, verbose: bool
):
    """Push local code changes to a new GitHub branch.

    \b
    This command:
    - Creates a new branch from main
    - Pushes your local files to the new branch
    - Optionally creates a pull request

    \b
    Examples:
        eds-code-sync push --branch feature/my-updates
        eds-code-sync push -b fix/form-bug --pr
        eds-code-sync push -b updates -m "Update components" --verbose
    """
    try:
        from .push import push_code

        # Load configuration
        click.echo("Loading configuration...")
        config = Config.from_env()

        if verbose:
            click.echo(f"  Repository: {config.github_repo}")
            click.echo(f"  Base branch: {config.github_branch}")
            click.echo(f"  New branch: {branch}")
            click.echo(f"  Source directory: {source}")

        # Load mapper
        if mapping:
            click.echo(f"Loading custom mapping from {mapping}")
            mapper = FileMapper.from_file(mapping)
        else:
            mapper = FileMapper()

        # Create progress callback
        def on_progress(msg: str) -> None:
            if verbose:
                click.echo(f"  {msg}")

        # Perform push
        click.echo(f"Pushing code to new branch '{branch}'...")
        branch_name, pushed, pr_url = push_code(
            config=config,
            source_dir=source,
            branch_name=branch,
            mapper=mapper,
            commit_message=message,
            create_pr=pr,
            on_progress=on_progress if verbose else None,
        )

        # Success output
        if pushed == 0:
            click.echo(f"⚠ No changes to commit - branch '{branch_name}' is up to date")
            click.secho("SUCCESS: Code is already up to date", fg="green")
        else:
            click.echo(f"✓ Pushed {pushed} files to branch '{branch_name}'")

            if pr_url:
                click.echo(f"✓ Pull request created: {pr_url}")
            else:
                repo_url = f"https://github.com/{config.github_repo}"
                click.echo(f"View branch: {repo_url}/tree/{branch_name}")

            click.secho("SUCCESS: Code pushed successfully", fg="green")

    except EDSCodeSyncError as e:
        click.secho(f"ERROR: {e}", fg="red", err=True)
        sys.exit(1)
    except Exception as e:
        if verbose:
            import traceback

            click.secho(
                f"UNEXPECTED ERROR: {e}\n{traceback.format_exc()}",
                fg="red",
                err=True,
            )
        else:
            click.secho(f"UNEXPECTED ERROR: {e}", fg="red", err=True)
        sys.exit(1)


@cli.command()
@click.option(
    "--source",
    "-s",
    default=None,
    type=click.Path(exists=True, path_type=Path),
    help="Source directory with local code (default: ./code)",
)
@click.option(
    "--mapping",
    "-m",
    default=None,
    type=click.Path(exists=True, path_type=Path),
    help="Custom mapping configuration JSON file",
)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
def validate(source: Path, mapping: Path, verbose: bool):
    """Validate local code changes against the EDS repository.

    \b
    This command:
    - Clones the GitHub repository
    - Applies your local code changes
    - Runs npm ci and npm run lint
    - Reports any validation errors

    \b
    Use this before pushing to catch lint errors early.

    \b
    Examples:
        eds-code-sync validate
        eds-code-sync validate --verbose
        eds-code-sync validate --source ./my-code
    """
    try:
        from .validate import validate_code

        # Load configuration
        click.echo("Loading configuration...")
        config = Config.from_env()

        # Resolve source directory
        if source:
            config.target_dir = source
        source_dir = config.target_dir

        if not source_dir.exists():
            click.secho(
                f"ERROR: Source directory not found: {source_dir}",
                fg="red",
                err=True,
            )
            sys.exit(1)

        if verbose:
            click.echo(f"  Repository: {config.github_repo}")
            click.echo(f"  Base branch: {config.github_branch}")
            click.echo(f"  Source directory: {source_dir}")

        # Load mapper
        if mapping:
            click.echo(f"Loading custom mapping from {mapping}")
            mapper = FileMapper.from_file(mapping)
        else:
            mapper = FileMapper()

        # Create progress callback
        def on_progress(msg: str) -> None:
            if verbose:
                click.echo(f"  {msg}")

        # Perform validation
        click.echo("Validating code...")
        passed, message = validate_code(
            config=config,
            source_dir=source_dir,
            mapper=mapper,
            on_progress=on_progress if verbose else None,
        )

        if passed:
            click.echo(f"✓ {message}")
            click.secho("SUCCESS: Validation passed", fg="green")
        else:
            click.echo(f"✗ {message}")
            click.secho("FAILED: Validation did not pass", fg="red", err=True)
            sys.exit(1)

    except EDSCodeSyncError as e:
        click.secho(f"ERROR: {e}", fg="red", err=True)
        sys.exit(1)
    except Exception as e:
        if verbose:
            import traceback

            click.secho(
                f"UNEXPECTED ERROR: {e}\n{traceback.format_exc()}",
                fg="red",
                err=True,
            )
        else:
            click.secho(f"UNEXPECTED ERROR: {e}", fg="red", err=True)
        sys.exit(1)


@cli.command()
@click.option(
    "--branch",
    "-b",
    required=True,
    help="Name of the branch to delete (required)",
)
@click.option(
    "--force",
    "-f",
    is_flag=True,
    help="Force delete without confirmation",
)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
def delete_branch(branch: str, force: bool, verbose: bool):
    """Delete a branch from the GitHub repository.

    \b
    This command:
    - Deletes the specified branch from GitHub
    - Cannot delete the default/main branch (safety check)

    \b
    Examples:
        eds-code-sync delete-branch --branch session-abc123
        eds-code-sync delete-branch -b feature/old-branch --force
    """
    try:
        from github import GithubException

        from .github_client import GitHubClient

        # Load configuration
        if verbose:
            click.echo("Loading configuration...")
        config = Config.from_env()

        if verbose:
            click.echo(f"  Repository: {config.github_repo}")
            click.echo(f"  Branch to delete: {branch}")

        # Initialize GitHub client
        client = GitHubClient(config)
        repo = client.get_repo()

        # Safety check: Don't allow deleting default branch
        if branch == repo.default_branch or branch in ["main", "master"]:
            click.secho(
                f"❌ Cannot delete default/main branch: {branch}", fg="red", bold=True
            )
            click.echo(
                "This is a safety check to prevent accidental deletion of main branches."
            )
            sys.exit(1)

        # Check if branch exists
        try:
            ref = repo.get_git_ref(f"heads/{branch}")
            if verbose:
                click.echo(f"✓ Found branch: {branch}")
        except GithubException as e:
            if e.status == 404:
                click.secho(f"❌ Branch not found: {branch}", fg="red")
                click.echo("The branch does not exist in the repository.")
                sys.exit(1)
            else:
                raise

        # Confirm deletion unless --force
        if not force:
            click.echo()
            click.echo(f"You are about to delete branch: {branch}")
            click.echo(f"Repository: {config.github_repo}")
            if not click.confirm("Are you sure you want to delete this branch?"):
                click.echo("Operation cancelled.")
                sys.exit(0)

        # Delete the branch
        if verbose:
            click.echo(f"Deleting branch '{branch}'...")

        try:
            ref.delete()
            click.secho(f"✓ Branch '{branch}' deleted successfully", fg="green")

            if verbose:
                click.echo(
                    f"Branch URL was: https://github.com/{config.github_repo}/tree/{branch}"
                )

        except GithubException as e:
            if e.status == 422:
                click.secho(
                    f"❌ Cannot delete branch: {e.data.get('message', 'Unknown error')}",
                    fg="red",
                )
                click.echo("The branch might be protected or the default branch.")
            else:
                raise

    except EDSCodeSyncError as e:
        click.secho(f"ERROR: {e}", fg="red", err=True)
        sys.exit(1)
    except Exception as e:
        if verbose:
            import traceback

            click.secho(
                f"UNEXPECTED ERROR: {e}\n{traceback.format_exc()}",
                fg="red",
                err=True,
            )
        else:
            click.secho(f"UNEXPECTED ERROR: {e}", fg="red", err=True)
        sys.exit(1)


@cli.command()
def init():
    """Create a .env.example file in the current directory."""
    env_example = """# GitHub Repository Configuration
GITHUB_REPO=gahuja1991/aem-boilerplate-forms
GITHUB_TOKEN=ghp_your_token_here
GITHUB_BRANCH=main

# Optional: Custom mapping configuration
# MAPPING_CONFIG=./custom-mapping.json
"""

    env_file = Path(".env.example")
    if env_file.exists():
        click.echo(".env.example already exists")
        return

    with open(env_file, "w") as f:
        f.write(env_example)

    click.secho("✓ Created .env.example", fg="green")
    click.echo("Copy it to .env and update with your credentials")


if __name__ == "__main__":
    cli()
