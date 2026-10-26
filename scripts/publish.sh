#!/usr/bin/env bash
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-perry421/PiliPlus-Web}"
BRANCH="main"

command -v git >/dev/null 2>&1 || { echo "ERROR: git is required." >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "ERROR: GitHub CLI (gh) is required. Install it from https://cli.github.com/" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js 20+ is required to validate this project." >&2; exit 1; }
node -e "const v=Number(process.versions.node.split('.')[0]); if(v<20) process.exit(1)" || { echo "ERROR: Node.js 20+ is required." >&2; exit 1; }
gh auth status >/dev/null

# A downloaded ZIP has no .git directory; initialize one when needed.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init -b "$BRANCH"
fi

# Derive a GitHub noreply identity only if this repository has no author configured.
GH_LOGIN="$(gh api user --jq .login)"
GH_ID="$(gh api user --jq .id)"
if ! git config user.name >/dev/null 2>&1; then git config user.name "$GH_LOGIN"; fi
if ! git config user.email >/dev/null 2>&1; then git config user.email "${GH_ID}+${GH_LOGIN}@users.noreply.github.com"; fi

npm run check
git branch -M "$BRANCH"
git add -A
if ! git diff --cached --quiet; then
  git commit -m "Build iOS-friendly PiliPlus Web PWA"
fi

if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "GitHub repository already exists: $REPO"
else
  gh repo create "$REPO" --public --description "Unofficial iOS-Safari-friendly Bilibili web companion shell"
fi

TARGET_URL="https://github.com/${REPO}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$TARGET_URL"
else
  git remote add origin "$TARGET_URL"
fi

git push -u origin "$BRANCH"
echo "Push complete. Waiting for the Pages workflow for commit $(git rev-parse --short HEAD)…"
HEAD_SHA="$(git rev-parse HEAD)"
RUN_ID=""
for _ in {1..30}; do
  RUN_ID="$(gh run list --repo "$REPO" --workflow pages.yml --branch "$BRANCH" --limit 10 --json databaseId,headSha --jq ".[] | select(.headSha == \"$HEAD_SHA\") | .databaseId" 2>/dev/null | head -n 1 || true)"
  if [[ -n "$RUN_ID" ]]; then break; fi
  sleep 1
done
if [[ -n "$RUN_ID" ]]; then
  if ! gh run watch "$RUN_ID" --repo "$REPO" --exit-status; then
    echo "ERROR: GitHub Actions failed. Inspect: https://github.com/${REPO}/actions/runs/${RUN_ID}" >&2
    exit 1
  fi
  SITE_URL="$(gh api "repos/${REPO}/pages" --jq .html_url 2>/dev/null || true)"
  if [[ -n "$SITE_URL" ]]; then
    echo "GitHub Pages deployment succeeded: $SITE_URL"
  else
    echo "Workflow succeeded, but the Pages URL could not be read automatically. Check Settings → Pages for the published URL."
  fi
else
  echo "No workflow run found for this commit yet. Check: https://github.com/${REPO}/actions/workflows/pages.yml"
  echo "Do not consider the site deployed until the workflow succeeds."
fi
