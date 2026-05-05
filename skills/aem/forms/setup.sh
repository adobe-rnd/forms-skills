#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AEM Forms Skills — Setup (wrapper)
#
# The canonical setup script lives inside the plugin directory at
# forms-orchestrator/scripts/setup.sh. This wrapper forwards to it
# for backwards compatibility.
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/forms-orchestrator/scripts/setup.sh" "$@"
