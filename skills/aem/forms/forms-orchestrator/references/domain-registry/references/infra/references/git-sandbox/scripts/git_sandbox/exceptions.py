"""Custom exceptions for git-sandbox."""


class GitSandboxError(Exception):
    """Base exception for all git-sandbox errors."""
    pass


class ConfigurationError(GitSandboxError):
    """Raised when configuration is missing or invalid."""
    pass


class ValidationError(GitSandboxError):
    """Raised when path or branch validation fails."""
    pass


class WorkspaceError(GitSandboxError):
    """Raised when workspace operations fail."""
    pass
