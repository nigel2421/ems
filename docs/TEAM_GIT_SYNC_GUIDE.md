# Team Git Synchronization Guide: Post-Secret Remediation

## Background
On November 4, 2026, repository history on `live-development` was sanitized to resolve GitGuardian security alerts:
- Leaked credentials, test passwords, and configuration files (`.env`, `.env.backup`, `ems_database.sqlite`) were eradicated from all historical commits.
- All commit hashes on `live-development` have been updated.

If you have a local clone with the older branch commits, follow the instructions below to synchronize cleanly.

---

## Instructions for Collaborators

### Scenario A: You have NO uncommitted local work
Run the following commands in your local repository terminal:

```bash
# 1. Fetch updated commits and branches from GitHub
git fetch origin

# 2. Switch to live-development
git checkout live-development

# 3. Reset your local branch to match the sanitized remote
git reset --hard origin/live-development

# 4. Clean untracked build caches if necessary
npm install
```

---

### Scenario B: You HAVE uncommitted or local commits
If you have work in progress on your local machine:

```bash
# 1. Stash your uncommitted working directory changes
git stash

# 2. Fetch rewritten remote history
git fetch origin

# 3. Rebase your custom commits onto the updated branch
git checkout live-development
git reset --hard origin/live-development

# 4. Re-apply your uncommitted changes
git stash pop
```

---

## Local Environment Setup (.env)
1. Copy [.env.example](file:///c:/Users/user/Documents/Websites/EMS/.env.example) to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate `.env` with your local development credentials.
3. **Never** commit `.env` or `.env.*` to Git. (These files are ignored in `.gitignore`).

---

## Credential Rotation Assistance
If you need to rotate local PostgreSQL database credentials or Google Maps keys, run:
- Linux / macOS: `./scripts/security/rotate-credentials.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\security\rotate-credentials.ps1`
