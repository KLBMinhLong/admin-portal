# UC-CI-02 - Quality va security gates

## Goal
Ap dung cong quality gate va security scan truoc khi merge/release.

## Actors
- Primary: DevOps, Security reviewer
- Secondary: CI pipeline, scanner tools

## Preconditions
- Build/test pipeline da co.

## Trigger
- Sau khi build/test thanh cong tren CI.

## Main Flow
1. Chay static analysis (style, bug patterns).
2. Chay dependency vulnerability scan (Maven + NPM).
3. Chay secret scanning (hardcoded key/token).
4. Validate code coverage threshold.
5. Neu co SonarQube -> enforce quality gate.
6. Chi pass khi tat ca gate dat.

## Alternate Flows
- A1: Vulnerability high/critical -> fail pipeline.
- A2: Coverage duoi nguong -> fail va yeu cau them test.

## Edge Cases
- False positive scan -> can allowlist co kiem soat.
- Dependency transitive co CVE: can policy update nhanh.

## Acceptance Criteria
- Khong merge code co secret hardcoded.
- Khong merge neu co CVE critical chua duoc chap thuan.
- Coverage backend dat muc toi thieu da dinh.

## Implementation Tasks
1. Them jobs scan dependency/secret.
2. Cau hinh threshold quality gate.
3. Luu report scan thanh artifact.
