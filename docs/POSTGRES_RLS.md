# 🔒 PostgreSQL Row-Level Security (RLS) & DB Role Hygiene

CI-EMS 3.1 enforces multi-tenant data isolation directly at the PostgreSQL database engine layer.

## Database Role Hygiene Requirements

The application database user MUST strictly adhere to the following privilege rules:

```sql
-- Application DB User Role Provisioning
CREATE ROLE ci_ems_app_user WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;

-- Revoke default public schema access
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO ci_ems_app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ci_ems_app_user;
```

## Row-Level Security Policies

For all 10 core tables (`evidence`, `submissions`, `agents`, `operational_cases`, `incidents`, `communications`, `surveys`, `devices`, `audit_metadata`, `reconciliation_cases`):

```sql
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence FORCE ROW LEVEL SECURITY;

CREATE POLICY evidence_tenant_isolation_policy ON evidence
  FOR ALL
  TO ci_ems_app_user
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));
```

- **Default-Deny Policy**: Unauthenticated transactions or missing session context variables return 0 rows.
- **Bypass Role Protection**: Superuser or `BYPASSRLS` roles are strictly prohibited for application connections.
