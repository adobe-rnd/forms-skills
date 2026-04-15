#!/usr/bin/env python3
"""Generate an API reference ("skill") from a cURL request.

Usage:
    python -m tools.api_skill --curl-file <path> [--title <title>] [--out <dir>]
    python -m tools.api_skill --curl "<curl ...>" [--title <title>] [--out <dir>]

This will:
  - Create `refs/apis/<slug>.md` based on `refs/apis/_template.md`
  - Update `refs/apis/_index.md` by inserting a new row
"""

from .cli import main


if __name__ == "__main__":
    raise SystemExit(main())

