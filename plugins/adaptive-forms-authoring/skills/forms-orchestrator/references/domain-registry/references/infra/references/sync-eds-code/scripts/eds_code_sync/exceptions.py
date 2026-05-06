"""Custom exceptions for EDS Code Sync."""


class EDSCodeSyncError(Exception):
    """Base exception for all eds-code-sync errors."""
    pass


class ConfigurationError(EDSCodeSyncError):
    """Raised when required configuration is missing or invalid."""
    pass


class GitHubError(EDSCodeSyncError):
    """Raised when GitHub API operations fail."""
    pass


class MappingError(EDSCodeSyncError):
    """Raised when file mapping fails."""
    pass


class FileWriteError(EDSCodeSyncError):
    """Raised when writing local files fails."""
    pass

