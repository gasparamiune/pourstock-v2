# Versioning Process

This document explains how PourStock tracks versions, ships releases, and keeps the changelog up to date. Follow this process for every change that reaches production.

---

## Version Number Format

PourStock uses **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Component | When to increment |
|-----------|------------------|
| **MAJOR** | Breaking changes — incompatible database migrations, removed features, or tenant-disrupting changes |
| **MINOR** | New features added in a backward-compatible way |
| **PATCH** | Bug fixes, performance improvements, documentation updates |

Current version: see `"version"` in `package.json`.

Examples: `1.0.0` → `1.1.0` (new feature) → `1.1.1` (hotfix) → `2.0.0` (breaking migration cutover)

---

## Files That Track the Version

| File | What to update | When |
|------|---------------|------|
| `package.json` | `"version"` field | Every release |
| `CHANGELOG.md` | Move Unreleased items to new version section | Every release |
| Build environment | `VITE_APP_VERSION` variable | Every deploy |

> These three must always stay in sync. A mismatch causes the in-app release system to behave incorrectly.

---

## Step-by-Step Release Process

### 1. During development — keep CHANGELOG updated

As you merge code changes, add a one-line summary under the `[Unreleased]` section in `CHANGELOG.md`. Use the correct change type:

```markdown
## [Unreleased]

### Added
- New room type management UI in Settings

### Fixed
- Dashboard stats card showing wrong occupancy when hotel has no stays
```

This ensures the changelog is always current and no changes are forgotten.

---

### 2. At release time

**a. Choose the version number**

Decide the new version based on the nature of the changes (major/minor/patch).

**b. Update `CHANGELOG.md`**

Replace the `[Unreleased]` heading with the new version and today's date:
```markdown
## [1.1.0] — 2026-04-15

### Added
- New room type management UI in Settings

### Fixed
- Dashboard stats card showing wrong occupancy when hotel has no stays
```

Add a new empty `[Unreleased]` section above it for the next cycle.

**c. Update `package.json`**

```json
{
  "version": "1.1.0"
}
```

**d. Commit and push**

```bash
git add CHANGELOG.md package.json
git commit -m "chore: release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

**e. Deploy with the correct version variable**

Set `VITE_APP_VERSION=1.1.0` in your deploy environment before running `npm run build`. This value is embedded into the frontend bundle at build time.

---

### 3. Automatic in-app release announcement

When the first user loads the new version:

1. `useReleaseAnnouncements` detects that no `release_announcements` row exists for `VITE_APP_VERSION`.
2. It calls the `create-autonomous-release` Edge Function with the version string.
3. The Edge Function:
   - Fetches commits since the last release from GitHub (`fetch-deployment-commits`)
   - Generates human-readable notes with Gemini (`generate-release-notes`)
   - Inserts a new `release_announcements` row with `is_published = true`
4. A release banner appears for all users on their next page load.

> **Prerequisite:** `GEMINI_API_KEY` and `GITHUB_TOKEN` secrets must be set in Supabase. Without them, the release is created with empty content (no crash, but no release notes).

---

### 4. Manual release announcement (optional)

To override the auto-generated notes or create a release manually:

1. Go to Supabase Table Editor → `release_announcements`
2. Insert a row with:
   - `version`: the version string (e.g. `1.1.0`)
   - `title`: short release name
   - `summary`: one-sentence description
   - `content`: JSON array of bullet points `["Added X", "Fixed Y"]`
   - `severity`: `info`, `important`, or `critical`
   - `is_published`: `true`
   - `published_at`: current timestamp
   - `source`: `manual`

---

## Version History Reference

See [`CHANGELOG.md`](../CHANGELOG.md) at the repository root for the full version history.

For detailed platform evolution (migration phases, architecture milestones), see [`docs/releases/platform-release-history.md`](releases/platform-release-history.md).

---

## CI Checks on Every Push

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on every push to `main` and every pull request:

1. **Lint** — `npm run lint` — catches ESLint violations
2. **Build** — `npm run build` — verifies the TypeScript compiles and Vite can bundle the app

> The CI uses placeholder Supabase credentials. It does not run against real data. Passing CI means the code is syntactically correct and builds — not that all runtime behavior is correct.

---

## Commit Message Convention

Use conventional commit prefixes to make the changelog easier to read:

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `chore:` | Maintenance, dependency updates, config changes |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring without behavior change |
| `perf:` | Performance improvements |
| `security:` | Security fixes |

The `create-autonomous-release` function uses commit messages to generate release notes, so descriptive commit messages directly improve the quality of the in-app changelog.

---

## Keeping This Document Up to Date

If the release process changes (e.g. CI adds automated tagging, the deploy platform changes), update this document in the same PR. The process should always reflect reality — an outdated process document is worse than no document.
