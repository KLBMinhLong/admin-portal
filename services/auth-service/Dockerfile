# Multi-stage build - auth-service
# OpenTelemetry Java Instrumentation Agent attach via javaagent

FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B -q
COPY src ./src
RUN mvn package -Dmaven.test.skip=true -B -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Download OTel agent
RUN apk add --no-cache curl && \
    curl -fsSL "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar" \
    -o /app/opentelemetry-javaagent.jar

COPY --from=builder /build/target/*.jar /app/auth-service.jar

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/logs && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8081

ENTRYPOINT ["java", \
  "-javaagent:/app/opentelemetry-javaagent.jar", \
  "-Dotel.instrumentation.spring-webmvc.enabled=true", \
  "-Dotel.instrumentation.jdbc.enabled=true", \
  "-Dotel.instrumentation.kafka.enabled=true", \
  "-Dotel.instrumentation.redis.enabled=true", \
  "-Dotel.logs.exporter=otlp", \
  "-Dotel.metrics.exporter=otlp", \
  "-Dotel.traces.exporter=otlp", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=70.0", \
  "-jar", "/app/auth-service.jar"]
