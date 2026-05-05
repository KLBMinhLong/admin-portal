# Keycloak Custom Providers

Primary login path:
- `adminportal-db-user-provider`
  - Reads `auth.user` from the PostgreSQL database.
  - Used by Keycloak direct grant when `auth-service` calls `/protocol/openid-connect/token`.

Future-only provider:
- `adminportal-remote-user-federation`
  - Reserved for a future remote user source.
  - Intentionally not attached to the imported realm, so it does not participate in login today.

Build locally:
```powershell
cd D:\AssignmentFISInterview\admin-portal\infrastructure\keycloak\providers
mvn package
```

The Docker setup already builds the provider jar through `infrastructure/keycloak/Dockerfile`.
