# UC-CI-03 - Docker image release flow

## Goal
Tu dong hoa quy trinh build/push Docker images va release version.

## Actors
- Primary: DevOps
- Secondary: CI pipeline, Docker registry

## Preconditions
- CI build/test/gates da pass.
- Co credentials registry trong secrets.

## Trigger
- Merge vao nhanh chinh hoac tao tag release.

## Main Flow
1. Xac dinh version/tag release.
2. Build images cho:
   - auth-service
   - domain-service
   - gateway-service
   - frontend
3. Tag image:
   - `:commit-sha`
   - `:version`
   - `:latest` (neu policy cho phep)
4. Push len registry.
5. Tao release note artifact.
6. (Optional) Trigger deploy staging.

## Alternate Flows
- A1: Push fail do auth -> fail pipeline, khong deploy tiep.
- A2: 1 image fail build -> fail toan bo release.

## Edge Cases
- Multi-arch image neu can ho tro nhieu platform.
- Tranh overwrite tag version da ton tai.

## Acceptance Criteria
- Images ton tai day du trong registry.
- Co traceability tu image tag -> commit.

## Implementation Tasks
1. Tao workflow `ci-release-images.yml`.
2. Cau hinh docker buildx + cache.
3. Tao convention version/tag.
