#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/bump-version.sh <version>
# Example: ./scripts/bump-version.sh 1.0.0
#
# Updates version in:
#   1. package.json
#   2. src-tauri/tauri.conf.json
#   3. src-tauri/Cargo.toml
#
# Then creates a git commit and tag (vX.Y.Z).
# You must push manually: git push && git push origin vX.Y.Z

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.0"
  exit 1
fi

# Validate semver-ish format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: Version must be in X.Y.Z format (e.g. 1.0.0)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Bumping version to $VERSION..."

# 1. package.json
jq --arg v "$VERSION" '.version = $v' "$ROOT_DIR/package.json" > "$ROOT_DIR/package.json.tmp"
mv "$ROOT_DIR/package.json.tmp" "$ROOT_DIR/package.json"
echo "  Updated package.json"

# 2. src-tauri/tauri.conf.json
jq --arg v "$VERSION" '.version = $v' "$ROOT_DIR/src-tauri/tauri.conf.json" > "$ROOT_DIR/src-tauri/tauri.conf.json.tmp"
mv "$ROOT_DIR/src-tauri/tauri.conf.json.tmp" "$ROOT_DIR/src-tauri/tauri.conf.json"
echo "  Updated src-tauri/tauri.conf.json"

# 3. src-tauri/Cargo.toml (update the first version = "..." line in [package])
sed -i.bak -E "s/^version = \"[0-9]+\.[0-9]+\.[0-9]+\"/version = \"$VERSION\"/" "$ROOT_DIR/src-tauri/Cargo.toml"
rm -f "$ROOT_DIR/src-tauri/Cargo.toml.bak"
echo "  Updated src-tauri/Cargo.toml"

# Git commit and tag
cd "$ROOT_DIR"
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to $VERSION"
git tag "v$VERSION"

echo ""
echo "Version bumped to $VERSION"
echo "Tag v$VERSION created"
echo ""
echo "Now run:"
echo "  git push && git push origin v$VERSION"
