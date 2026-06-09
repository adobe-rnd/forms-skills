#!/usr/bin/env bash
# resolve-repo.sh
#
# Locate a git repo to operate on, using exactly two strategies:
#   1. current working directory (if inside a git repo)
#   2. ${HOME}/form-auto-fix/<REPO_NAME>
#
# If neither hits and --clone-url is provided, auto-clone into
# ${HOME}/form-auto-fix/<REPO_NAME>. If still nothing, print "ask" so the
# skill knows to ask the user.
#
# Usage:
#   eval "$(bash shared/scripts/resolve-repo.sh)"                           # cwd-only
#   eval "$(bash shared/scripts/resolve-repo.sh --name HDFC_PLForms)"        # cwd → workspace lookup
#   eval "$(bash shared/scripts/resolve-repo.sh --name foo \
#                                                  --clone-url https://github.com/org/foo.git)"
#
# Output (eval-able exports + a trailing JSON-comment line):
#   REPO_PATH      absolute path of the resolved repo (empty if not resolved)
#   REPO_NAME      basename($REPO_PATH)
#   REPO_REMOTE    origin remote URL (or "no remote")
#   REPO_SOURCE    cwd | workspace | cloned | ask
#
# Diagnostics on stderr. Never prompts.

set -uo pipefail

NAME=""
CLONE_URL=""
while [ $# -gt 0 ]; do
  case "$1" in
    --name)      NAME="$2";      shift 2 ;;
    --clone-url) CLONE_URL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

WORKSPACE="${HOME}/form-auto-fix"
REPO_PATH=""
REPO_SOURCE=""

log() { echo "[resolve-repo] $*" >&2; }

# Strategy 1 — cwd
if git -C "$PWD" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_PATH=$(git -C "$PWD" rev-parse --show-toplevel)
  REPO_SOURCE="cwd"
fi

# Strategy 2 — workspace lookup (only if --name was given AND cwd didn't already match)
if [ -z "$REPO_PATH" ] && [ -n "$NAME" ]; then
  CAND="$WORKSPACE/$NAME"
  if git -C "$CAND" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    REPO_PATH="$CAND"
    REPO_SOURCE="workspace"
  fi
fi

# Strategy 3 — clone into workspace
if [ -z "$REPO_PATH" ] && [ -n "$NAME" ] && [ -n "$CLONE_URL" ]; then
  CAND="$WORKSPACE/$NAME"
  mkdir -p "$WORKSPACE"
  log "cloning $CLONE_URL → $CAND"
  if git clone --depth 50 "$CLONE_URL" "$CAND" 2>/tmp/resolve-repo-clone-stderr.txt; then
    REPO_PATH="$CAND"
    REPO_SOURCE="cloned"
  else
    log "clone failed: $(head -2 /tmp/resolve-repo-clone-stderr.txt)"
  fi
fi

REPO_NAME=""
REPO_REMOTE=""
if [ -n "$REPO_PATH" ]; then
  REPO_NAME=$(basename "$REPO_PATH")
  REPO_REMOTE=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || echo "no remote")
else
  REPO_SOURCE="ask"
fi

printf 'export REPO_PATH=%q\n'   "$REPO_PATH"
printf 'export REPO_NAME=%q\n'   "$REPO_NAME"
printf 'export REPO_REMOTE=%q\n' "$REPO_REMOTE"
printf 'export REPO_SOURCE=%q\n' "$REPO_SOURCE"

printf '# {"path":"%s","name":"%s","remote":"%s","source":"%s"}\n' \
  "$REPO_PATH" "$REPO_NAME" "$REPO_REMOTE" "$REPO_SOURCE"
