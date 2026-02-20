#!/usr/bin/env bash
# Bump version across all project files (package.json, Cargo.toml, tauri.conf.json)
# Usage: ./scripts/bump-version.sh <new_version>
# Example: ./scripts/bump-version.sh 0.3.0

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <new_version>"
  echo "Example: $0 0.3.0"
  exit 1
fi

NEW_VERSION="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Bumping version to $NEW_VERSION..."

# package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$ROOT/package.json"

# src-tauri/Cargo.toml (only the package version, not dependency versions)
sed -i "0,/^version = \"[^\"]*\"/s/^version = \"[^\"]*\"/version = \"$NEW_VERSION\"/" "$ROOT/src-tauri/Cargo.toml"

# src-tauri/tauri.conf.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$ROOT/src-tauri/tauri.conf.json"

echo "Updated:"
echo "  package.json        -> $NEW_VERSION"
echo "  src-tauri/Cargo.toml -> $NEW_VERSION"
echo "  tauri.conf.json      -> $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  git add -A && git commit -m \"chore: bump version to v$NEW_VERSION\""
echo "  git tag v$NEW_VERSION"
