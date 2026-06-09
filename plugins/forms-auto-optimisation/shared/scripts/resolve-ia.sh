#!/usr/bin/env bash
# resolve-ia.sh
#
# Resolve the impact-analyser toolchain into ${HOME}/.impact-analyser/
# (the canonical, shareable location — usable by anything, not just this skill):
#   - CLI binary at ${HOME}/.impact-analyser/cli/index.js
#       (auto-downloaded from adobe-aem-forms/impact-analyser releases)
#   - ${HOME}/.impact-analyser/impact-graph.sqlite
#       (auto-downloaded from adobe-aem-forms/impact-analyser-graph)
#   - ${HOME}/.impact-analyser/impact-analyser.config.yaml
#       (same source as the graph)
#
# Idempotent: re-running uses whatever is already present. Picks the right
# gh account when the user has multiple. Rewrites IA_CMD for Node 20 ABI
# when system Node is ≥ 21.
#
# Usage:
#   eval "$(bash shared/scripts/resolve-ia.sh)"
#
# After eval, these env vars are set:
#   IA_CMD          string command to run (use as: eval $IA_CMD <subcmd>)
#   IA_GRAPH        absolute path or empty
#   IA_CONFIG       absolute path or empty
#   IA_GRAPH_FLAG   '--graph "<path>"' or empty
#   IA_CONFIG_FLAG  '--config "<path>"' or empty
#   IA_CONCEPT_ONLY '--concept-only' or empty (when no graph)
#   IA_UNAVAILABLE  empty on success, else a one-line reason
#
# The last stdout line is a JSON summary (as a shell comment so eval ignores it):
#   # {"cli":"...","graph":"...","config":"...","unavailable":null|"reason"}

set -uo pipefail

IA_ROOT="${HOME}/.impact-analyser"
IA_DIR="${IA_ROOT}/cli"
GRAPH_PATH="${IA_ROOT}/impact-graph.sqlite"
CONFIG_PATH="${IA_ROOT}/impact-analyser.config.yaml"
GRAPH_RELEASE="impact-graph-hdfc"

mkdir -p "$IA_ROOT" "$IA_DIR"

log() { echo "[resolve-ia] $*" >&2; }

# ── pick a gh account that can reach adobe-aem-forms ─────────────────────────
GH_TOKEN=""
GH_USER=""
if command -v gh >/dev/null 2>&1; then
  for U in $(gh auth status 2>&1 | grep -oE 'account [^ ]+' | awk '{print $2}'); do
    T=$(gh auth token --hostname github.com --user "$U" 2>/dev/null || true)
    if [ -n "$T" ] && GITHUB_TOKEN="$T" gh release list \
        --repo adobe-aem-forms/impact-analyser >/dev/null 2>&1; then
      GH_TOKEN="$T"
      GH_USER="$U"
      log "gh account '$U' has access to adobe-aem-forms"
      break
    fi
  done
fi
[ -z "$GH_TOKEN" ] && log "WARN no gh account with access to adobe-aem-forms — downloads may fail"

# ── CLI ──────────────────────────────────────────────────────────────────────
IA_CMD=""
IA_UNAVAILABLE=""

if command -v ia >/dev/null 2>&1; then
  IA_CMD="ia"
elif [ -f "$IA_DIR/index.js" ]; then
  IA_CMD="node $IA_DIR/index.js"
else
  log "installing ia CLI..."
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)
  case "$ARCH" in arm64|aarch64) ARCH_TAG="arm64" ;; *) ARCH_TAG="x64" ;; esac
  case "$OS"   in darwin) OS_TAG="darwin"          ;; *) OS_TAG="linux"  ;; esac
  PATTERN="impact-analyser-cli-${OS_TAG}-${ARCH_TAG}.tar.gz"

  if [ -n "$GH_TOKEN" ] && GITHUB_TOKEN="$GH_TOKEN" gh release download \
        --repo adobe-aem-forms/impact-analyser \
        --pattern "$PATTERN" \
        --dir /tmp --clobber 2>/tmp/ia-install-stderr.txt \
     && tar -xzf "/tmp/${PATTERN}" -C "$IA_ROOT" 2>>/tmp/ia-install-stderr.txt; then
    # The tarball extracts to either ia-cli/ or impact-analyser/cli/ depending on
    # release packaging. Normalise: ensure $IA_DIR/index.js exists.
    if [ ! -f "$IA_DIR/index.js" ]; then
      FOUND=$(find "$IA_ROOT" -maxdepth 4 -name index.js -path '*cli*' 2>/dev/null | head -1)
      if [ -n "$FOUND" ]; then
        rm -rf "$IA_DIR"
        mv "$(dirname "$FOUND")" "$IA_DIR"
      fi
    fi
    if [ -f "$IA_DIR/index.js" ]; then
      IA_CMD="node $IA_DIR/index.js"
      log "installed ia CLI → $IA_DIR/index.js"
    else
      IA_UNAVAILABLE="ia CLI tarball extracted but index.js not found"
    fi
  else
    IA_UNAVAILABLE="ia CLI install failed: $(head -2 /tmp/ia-install-stderr.txt 2>/dev/null)"
    log "$IA_UNAVAILABLE"
  fi
fi

# ── Node ABI rewrite (better_sqlite3 ABI 115 needs Node 20) ──────────────────
if [ -n "$IA_CMD" ] && [ -z "$IA_UNAVAILABLE" ]; then
  NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)
  if [ "${NODE_MAJOR:-0}" -ge 21 ]; then
    NODE20=$(ls "$HOME/.nvm/versions/node/v20".*/bin/node 2>/dev/null | sort -V | tail -1)
    if [ -n "$NODE20" ]; then
      IA_CMD="$NODE20 $IA_DIR/index.js"
      log "system Node $NODE_MAJOR — re-routed to Node 20 ($NODE20)"
    else
      IA_UNAVAILABLE="ia CLI needs Node 20 (ABI 115); system is Node $NODE_MAJOR. Fix: nvm install 20"
    fi
  fi
fi

# ── Graph ────────────────────────────────────────────────────────────────────
IA_GRAPH=""
if [ -f "$GRAPH_PATH" ]; then
  IA_GRAPH="$GRAPH_PATH"
elif [ -n "$GH_TOKEN" ]; then
  log "downloading impact-graph.sqlite..."
  if GITHUB_TOKEN="$GH_TOKEN" gh release download "$GRAPH_RELEASE" \
       --repo adobe-aem-forms/impact-analyser-graph \
       --pattern impact-graph.sqlite \
       --dir "$IA_ROOT" --clobber 2>/tmp/ia-graph-dl-stderr.txt; then
    IA_GRAPH="$GRAPH_PATH"
    log "graph → $GRAPH_PATH"
  else
    log "graph download failed: $(head -2 /tmp/ia-graph-dl-stderr.txt)"
  fi
fi

# ── Config ───────────────────────────────────────────────────────────────────
IA_CONFIG=""
if [ -f "$CONFIG_PATH" ]; then
  IA_CONFIG="$CONFIG_PATH"
elif [ -n "$GH_TOKEN" ]; then
  log "downloading impact-analyser.config.yaml..."
  if GITHUB_TOKEN="$GH_TOKEN" gh release download "$GRAPH_RELEASE" \
       --repo adobe-aem-forms/impact-analyser-graph \
       --pattern "impact-analyser.config.yaml" \
       --dir "$IA_ROOT" --clobber 2>/tmp/ia-config-dl-stderr.txt; then
    IA_CONFIG="$CONFIG_PATH"
    log "config → $CONFIG_PATH"
  else
    log "config download failed (non-fatal): $(head -2 /tmp/ia-config-dl-stderr.txt)"
  fi
fi

# ── Build flags ──────────────────────────────────────────────────────────────
IA_GRAPH_FLAG=""
IA_CONFIG_FLAG=""
IA_CONCEPT_ONLY=""
[ -n "$IA_GRAPH"  ] && IA_GRAPH_FLAG='--graph "'"$IA_GRAPH"'"'
[ -n "$IA_CONFIG" ] && IA_CONFIG_FLAG='--config "'"$IA_CONFIG"'"'
[ -z "$IA_GRAPH"  ] && IA_CONCEPT_ONLY='--concept-only'

# Emit eval-able exports
printf 'export IA_CMD=%q\n'           "${IA_CMD:-}"
printf 'export IA_GRAPH=%q\n'         "${IA_GRAPH:-}"
printf 'export IA_CONFIG=%q\n'        "${IA_CONFIG:-}"
printf 'export IA_GRAPH_FLAG=%q\n'    "$IA_GRAPH_FLAG"
printf 'export IA_CONFIG_FLAG=%q\n'   "$IA_CONFIG_FLAG"
printf 'export IA_CONCEPT_ONLY=%q\n'  "$IA_CONCEPT_ONLY"
printf 'export IA_UNAVAILABLE=%q\n'   "${IA_UNAVAILABLE:-}"

# JSON summary on the last stdout line, as a shell comment
UNAVAIL_JSON="null"
[ -n "${IA_UNAVAILABLE:-}" ] && UNAVAIL_JSON="\"${IA_UNAVAILABLE//\"/\\\"}\""
printf '# {"cli":"%s","graph":"%s","config":"%s","unavailable":%s}\n' \
  "${IA_CMD:-}" "${IA_GRAPH:-}" "${IA_CONFIG:-}" "$UNAVAIL_JSON"
