# 📦 Release Provenance & Build Manifest Guide

CI-EMS 3.1 requires complete forensic traceability across all software deployments.

## Release Manifest Schema

Every production release artifact includes a signed `ReleaseManifest`:

```json
{
  "release_id": "CIEMS-3.1.4-RC2",
  "git_commit": "a92f72c4e1b82d4901b3",
  "build_hash": "b94a8e32110c99f12d8a5e3c7b2d109f",
  "application_version": "3.1.4",
  "schema_version": "SCHEMA-0073",
  "rls_policy_version": "RLS-0018",
  "privacy_policy_version": "DP-009",
  "retention_policy_version": "RET-011",
  "geography_dataset_version": "IEBC-2027-GAZ-V3",
  "statutory_form_registry_version": "FORMS-KE-2027-V2",
  "deployed_at": "2026-09-19T21:30:00Z",
  "deployed_by": "CI/CD Automated Release Pipeline",
  "approved_by": "Chief Technology Officer & Chief Information Security Officer",
  "environment": "STAGING"
}
```

## Forensic Verification

The `verifyReleaseProvenance()` function calculates a SHA-256 manifest digest and confirms that all 12 mandatory provenance metadata fields exist prior to allowing production deployment sign-off.
