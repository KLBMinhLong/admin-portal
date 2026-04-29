FROM maven:3.9.9-eclipse-temurin-21 AS provider-builder

WORKDIR /workspace
COPY providers/pom.xml providers/pom.xml
COPY providers/src providers/src
RUN mvn -f providers/pom.xml -q -DskipTests package

FROM quay.io/keycloak/keycloak:24.0

COPY --from=provider-builder /workspace/providers/target/adminportal-keycloak-providers-1.0.0-SNAPSHOT.jar /opt/keycloak/providers/
COPY realms /opt/keycloak/data/import

RUN /opt/keycloak/bin/kc.sh build --health-enabled=true
