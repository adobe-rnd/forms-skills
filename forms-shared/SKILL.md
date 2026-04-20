---
name: forms-shared
description: Shared scripts and Python runtime for AEM Forms skills — provides api-manager, workspace resolution, and the Python venv used across all domain modules.
license: Apache-2.0
---

Foundation module for the AEM Forms skill pack. Not invoked directly — domain modules depend on it for shared CLI tools and the Python runtime.

## Provided Tools

| Tool | Description |
|------|-------------|
| `api-manager` | Manage OpenAPI specs and generate typed JS clients |
| `python3` | Venv-aware Python wrapper — bootstraps `.venv` on first run |
| `_resolve-workspace` | Workspace resolver sourced by all CLI tools |
| `setup.sh` | Bootstrap the Python virtual environment |
