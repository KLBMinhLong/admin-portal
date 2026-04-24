# UC-SEC-01 - Ma hoa request/response (AES-GCM)

## Goal
Bao ve payload nhay cam bang AES-256-GCM trong qua trinh FE <-> BE.

## Actors
- Primary: Frontend app
- Secondary: Gateway/Auth/Domain services

## Preconditions
- Co `ENCRYPT_SECRET` hop le (32 bytes sau decode).
- FE va BE thong nhat format encrypted payload.

## Trigger
- Cac endpoint danh dau nhay cam.

## Payload Contract
```json
{
  "data": "base64_ciphertext",
  "iv": "base64_iv"
}
```

## Main Flow
1. FE encrypt body truoc khi gui.
2. Gateway/service decrypt payload.
3. Xu ly business logic tren plain object.
4. Truoc khi tra response, service encrypt lai.
5. FE decrypt de hien thi.

## Alternate Flows
- A1: IV sai format -> `400 INVALID_ENCRYPTED_PAYLOAD`.
- A2: Decrypt fail (tag mismatch) -> `400 DECRYPTION_FAILED`.
- A3: Secret config sai -> `500 ENCRYPTION_CONFIG_ERROR`.

## Edge Cases
- Replay payload cu: ket hop voi idempotency key de tranh duplicate.
- Chi encrypt endpoint can thiet, tranh overhead cho health/public static.

## Acceptance Criteria
- Khong tra plain text cho endpoint nhay cam.
- Decrypt/encrypt pass voi data UTF-8 va payload lon hop ly.
- Co test crypto round-trip.

## Implementation Tasks
1. Tao `AesGcmEncryptionService`.
2. Tao annotation/aspect hoac interceptor encrypt response.
3. Tao request resolver decrypt body.
4. Viet integration test mismatch tag.
