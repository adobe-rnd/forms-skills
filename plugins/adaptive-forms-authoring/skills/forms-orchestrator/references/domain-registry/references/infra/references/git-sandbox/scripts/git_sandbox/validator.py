"""Path and branch validation for git-sandbox."""

import fnmatch
from typing import List, Tuple


def validate_paths(files: List[str], allowed_patterns: List[str]) -> Tuple[List[str], List[str]]:
    """
    Validate file paths against allowed patterns.

    Args:
        files: List of file paths to validate
        allowed_patterns: List of glob patterns (fnmatch style)

    Returns:
        Tuple of (allowed_files, denied_files)

    Examples:
        >>> validate_paths(["src/foo.js", "secret.env"], ["src/**"])
        (["src/foo.js"], ["secret.env"])
    """
    allowed = []
    denied = []

    for file_path in files:
        if _matches_any_pattern(file_path, allowed_patterns):
            allowed.append(file_path)
        else:
            denied.append(file_path)

    return allowed, denied


def validate_branch(branch: str, allowed_patterns: List[str]) -> bool:
    """
    Validate branch name against allowed patterns.

    Args:
        branch: Branch name to validate
        allowed_patterns: List of glob patterns (fnmatch style)

    Returns:
        True if branch matches any allowed pattern

    Examples:
        >>> validate_branch("session-123", ["session-*", "claude-*"])
        True
        >>> validate_branch("main", ["session-*"])
        False
    """
    return _matches_any_pattern(branch, allowed_patterns)


def _matches_any_pattern(value: str, patterns: List[str]) -> bool:
    """
    Check if value matches any of the given patterns.

    Supports fnmatch glob patterns:
    - * matches anything except /
    - ** matches anything including /
    - ? matches any single character
    - [seq] matches any character in seq
    - [!seq] matches any character not in seq
    """
    for pattern in patterns:
        # Handle ** for recursive matching
        if "**" in pattern:
            # Convert ** to match any path
            regex_pattern = pattern.replace("**", "__DOUBLE_STAR__")
            regex_pattern = fnmatch.translate(regex_pattern)
            regex_pattern = regex_pattern.replace("__DOUBLE_STAR__", ".*")

            import re
            if re.match(regex_pattern, value):
                return True
        else:
            if fnmatch.fnmatch(value, pattern):
                return True

    return False
