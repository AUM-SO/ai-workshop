# Develop Flow

This project follows a Git Flow style branching model built around a long-lived `develop` branch.

## Branches

| Branch       | Purpose                                   | Branched from | Merges into          |
|--------------|-------------------------------------------|---------------|----------------------|
| `main`       | Production-ready code. Every commit is a release. | —      | —                    |
| `develop`    | Integration branch for the next release.  | `main`        | `release/*`          |
| `feature/*`  | New features and non-urgent changes.      | `develop`     | `develop`            |
| `bugfix/*`   | Non-urgent bug fixes.                     | `develop`     | `develop`            |
| `release/*`  | Stabilising a release (fixes, version bump only). | `develop` | `main` and `develop` |
| `hotfix/*`   | Urgent fixes for production.              | `main`        | `main` and `develop` |

Rules:

- Never commit directly to `main` or `develop`. All changes go through a pull request.
- Keep branch names short and kebab-case: `feature/login-page`, `bugfix/123-null-total`.
- Delete feature, bugfix, release and hotfix branches after they are merged.

## Day-to-day workflow

### 1. Start a feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<short-name>
```

### 2. Work and commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add login form
fix: handle empty cart total
docs: update setup steps
refactor: extract price helper
test: cover checkout edge cases
chore: bump dependencies
```

Keep your branch current with `develop`:

```bash
git fetch origin
git rebase origin/develop
```

### 3. Open a pull request

- Push: `git push -u origin feature/<short-name>`
- Open a PR into `develop`.
- At least one review approval and passing checks before merge.
- Prefer **squash merge** so `develop` stays readable.

### 4. Release

```bash
git checkout develop && git pull
git checkout -b release/1.2.0
# only bug fixes, version bump and changelog here
```

Open a PR from `release/1.2.0` into `main`. After merge:

```bash
git checkout main && git pull
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0
```

Then merge `main` back into `develop` so the release fixes are not lost.

### 5. Hotfix

```bash
git checkout main && git pull
git checkout -b hotfix/<short-name>
```

PR into `main`, tag a patch version (e.g. `v1.2.1`), then merge `main` back into `develop`.

## Versioning

Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- `MAJOR` – breaking changes
- `MINOR` – new features (release branches)
- `PATCH` – bug fixes (hotfix branches)

## Recommended remote settings

When the repository is pushed to GitHub/GitLab:

- Set `develop` as the default branch.
- Protect `main` and `develop`: require PRs, at least one approval, passing status checks, and block force pushes.
