#!/usr/bin/env bash
set -euo pipefail

TOOL=""

usage() {
  echo "Usage: $0 [--tool <tool-name>]"
  echo ""
  echo "Options:"
  echo "  --tool <name>   Tool to install and configure (e.g. claude-code)"
  echo ""
  echo "Examples:"
  echo "  $0                       # Full project setup"
  echo "  $0 --tool claude-code    # Setup + install Claude Code CLI"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      [[ -z "${2:-}" ]] && { echo "Error: --tool requires a value"; usage; }
      TOOL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { echo "[install] $*"; }

# ── 1. Node dependencies ─────────────────────────────────────────────────────
log "Installing Node.js dependencies..."
npm install

# ── 2. .env ──────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    log "Created .env from .env.example — edit DATABASE_URL and ANTHROPIC_API_KEY before starting."
  else
    cat > .env <<'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/aduana_saas"
ANTHROPIC_API_KEY="sk-ant-api03-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
    log "Created .env with placeholder values — update before starting."
  fi
else
  log ".env already exists, skipping."
fi

# ── 3. Prisma client ──────────────────────────────────────────────────────────
log "Generating Prisma client..."
npm run db:generate

# ── 4. Tool-specific setup ───────────────────────────────────────────────────
if [[ "$TOOL" == "claude-code" ]]; then
  log "Setting up Claude Code..."

  if command -v claude &>/dev/null; then
    CLAUDE_VERSION="$(claude --version 2>/dev/null || echo "unknown")"
    log "Claude Code already installed: $CLAUDE_VERSION"
  else
    log "Installing Claude Code CLI globally..."
    npm install -g @anthropic-ai/claude-code
    log "Claude Code installed: $(claude --version 2>/dev/null || echo 'check PATH')"
  fi

  if [[ ! -f CLAUDE.md ]]; then
    log "Warning: CLAUDE.md not found. Run 'claude /init' to create one."
  else
    log "CLAUDE.md found."
  fi

  log ""
  log "Next steps for Claude Code:"
  log "  1. Set ANTHROPIC_API_KEY in .env"
  log "  2. Run: claude"

elif [[ -n "$TOOL" ]]; then
  echo "Error: unknown tool '$TOOL'"
  usage
fi

# ── Done ──────────────────────────────────────────────────────────────────────
log ""
log "Setup complete."
log "  Start dev server : npm run dev"
log "  Push DB schema   : npm run db:push"
log "  Seed sample data : npm run db:seed"
