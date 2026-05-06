"""GitHub API client for EDS Code Sync (simplified - PR creation only)."""

from typing import Optional
from github import Github, GithubException
from .config import Config
from .exceptions import GitHubError


class GitHubClient:
    """Simplified client for GitHub API (PR creation only)."""

    def __init__(self, config: Config):
        """
        Initialize the GitHub client.

        Args:
            config: Configuration object with GitHub credentials.
        """
        self.config = config
        self.github = Github(config.github_token)
        self._repo = None

    def get_repo(self):
        """
        Get the GitHub repository object.

        Returns:
            Repository object.

        Raises:
            GitHubError: If repository cannot be accessed.
        """
        if self._repo is None:
            try:
                self._repo = self.github.get_repo(self.config.github_repo)
            except GithubException as e:
                raise GitHubError(
                    f"Failed to access repository {self.config.github_repo}: {e}"
                )
        return self._repo

    def create_pull_request(
        self,
        head_branch: str,
        base_branch: str,
        title: str,
        body: str = ""
    ) -> str:
        """
        Create a pull request.

        Args:
            head_branch: Source branch (your changes).
            base_branch: Target branch (usually main).
            title: PR title.
            body: PR description.

        Returns:
            URL of the created PR.

        Raises:
            GitHubError: If PR creation fails.
        """
        repo = self.get_repo()

        try:
            pr = repo.create_pull(
                title=title,
                body=body,
                head=head_branch,
                base=base_branch
            )
            return pr.html_url
        except GithubException as e:
            raise GitHubError(f"Failed to create PR: {e}")

    def delete_branch(self, branch_name: str) -> None:
        """
        Delete a branch from the repository.

        Args:
            branch_name: Name of the branch to delete.

        Raises:
            GitHubError: If branch deletion fails.
        """
        repo = self.get_repo()

        try:
            # Get the reference
            ref = repo.get_git_ref(f"heads/{branch_name}")
            # Delete it
            ref.delete()
        except GithubException as e:
            if e.status == 404:
                raise GitHubError(f"Branch not found: {branch_name}")
            elif e.status == 422:
                raise GitHubError(f"Cannot delete branch (might be protected): {branch_name}")
            else:
                raise GitHubError(f"Failed to delete branch: {e}")

    def branch_exists(self, branch_name: str) -> bool:
        """
        Check if a branch exists in the repository.

        Args:
            branch_name: Name of the branch to check.

        Returns:
            True if branch exists, False otherwise.
        """
        repo = self.get_repo()

        try:
            repo.get_git_ref(f"heads/{branch_name}")
            return True
        except GithubException as e:
            if e.status == 404:
                return False
            raise GitHubError(f"Failed to check branch existence: {e}")
