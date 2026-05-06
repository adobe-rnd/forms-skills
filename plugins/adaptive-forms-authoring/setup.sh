#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AEM Forms Skills — Setup (wrapper)
#
# The canonical setup script lives inside the orchestrator skill at
# skills/forms-orchestrator/scripts/setup.sh. This wrapper forwards to it
# so users can run setup from the plugin root.
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/skills/forms-orchestrator/scripts/setup.sh" "$@"
