-- ============================================================
-- PostgreSQL init: Create dedicated schemas and drop public
-- Schemas: keycloak, auth, domain
-- ============================================================

CREATE SCHEMA IF NOT EXISTS keycloak;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS domain;

-- Revoke all on public schema and drop it so no tables land there
REVOKE ALL ON SCHEMA public FROM PUBLIC;
DROP SCHEMA IF EXISTS public CASCADE;
