# Honey Chain — Testing Checklist

> Mark **Actual Result** and **Pass/Fail** after executing each test case.
> A feature is only marked ✅ PASS after you have verified it yourself.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Pass — verified and working |
| ❌ | Fail — broken |
| ⚠️ | Partial — works with caveats |
| 🔲 | Not yet tested |
| N/A | Not applicable (feature not implemented) |

---

## TC-01: API Health Check

| Field | Detail |
|---|---|
| **Steps** | GET `http://localhost:4000/api/public/health` |
| **Expected** | `{"success":true,"data":{"status":"healthy",...}}` HTTP 200 |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Ensure backend is running and DB is connected |

---

## TC-02: User Registration

| Field | Detail |
|---|---|
| **Steps** | POST `/api/auth/register` with `{email, password, firstName, lastName, role:"BEEKEEPER"}`. Password must have 8+ chars, 1 uppercase, 1 number. |
| **Expected** | HTTP 201, user object returned with `status:"ACTIVE"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-03: Duplicate Email Registration

| Field | Detail |
|---|---|
| **Steps** | POST `/api/auth/register` with the same email used in TC-02 |
| **Expected** | HTTP 409, `error.code:"EMAIL_TAKEN"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-04: Login

| Field | Detail |
|---|---|
| **Steps** | POST `/api/auth/login` with credentials from TC-02 |
| **Expected** | HTTP 200, `{accessToken, refreshToken, user}` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-05: Invalid Login

| Field | Detail |
|---|---|
| **Steps** | POST `/api/auth/login` with wrong password |
| **Expected** | HTTP 401, `error.code:"INVALID_CREDENTIALS"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-06: Beekeeper Profile Creation

| Field | Detail |
|---|---|
| **Steps** | POST `/api/beekeepers` with Auth header (BEEKEEPER role). Body: `{district, state, experienceYears}` |
| **Expected** | HTTP 200/201, beekeeper profile created with auto-generated `beekeeperCode` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | User must have BEEKEEPER role — set it during registration |

---

## TC-07: Hive Registration

| Field | Detail |
|---|---|
| **Steps** | POST `/api/hives` with Auth header. Body: `{name, hiveCode, hiveType, species, village, district, state}` |
| **Expected** | HTTP 201, hive created with status `ACTIVE` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Beekeeper profile must exist first (TC-06) |

---

## TC-08: Hive List

| Field | Detail |
|---|---|
| **Steps** | GET `/api/hives` with Auth header |
| **Expected** | HTTP 200, paginated list including hive from TC-07 |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-09: IoT Device Registration

| Field | Detail |
|---|---|
| **Steps** | POST `/api/devices` with BEEKEEPER/ADMIN auth. Body: `{deviceId:"SENSOR-001", hiveId:"<uuid>", deviceType:"MULTI_SENSOR"}` |
| **Expected** | HTTP 201, device created with a raw `apiKey` in the response |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Save the raw API key — it is only shown once |

---

## TC-10: IoT Telemetry Ingestion

| Field | Detail |
|---|---|
| **Steps** | POST `/api/iot/telemetry` with header `X-Device-API-Key: <rawKey>` from TC-09. Body: `{deviceId:"SENSOR-001", timestamp:"<ISO>", temperature:35, humidity:55, weight:12.5, batteryLevel:80}` |
| **Expected** | HTTP 200, `{telemetryId, processedAt}` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Device must be registered and API key must be raw (not hashed) |

---

## TC-11: Telemetry Alert Generation

| Field | Detail |
|---|---|
| **Steps** | POST `/api/iot/telemetry` with `temperature:42` (above 38°C threshold) |
| **Expected** | HTTP 200, and an alert with `alertType:"TEMPERATURE_HIGH"` visible in `/api/alerts` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-12: Create Honey Batch

| Field | Detail |
|---|---|
| **Steps** | POST `/api/batches` with BEEKEEPER auth. Body: `{floralSource:"Mustard Flora", variety:"Raw & Unprocessed", harvestSeason:"Spring Harvest", harvestYear:2026, totalQuantityKg:150}` |
| **Expected** | HTTP 201, batch with `status:"DRAFT"` and unique `publicBatchId` in format `HC-YYYYMM-XXXXXX` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-13: Add Honey Collection Record

| Field | Detail |
|---|---|
| **Steps** | POST `/api/batches/:batchId/collections`. Body: `{batchId, hiveId, collectionDate:"<ISO>", quantityKg:50}` |
| **Expected** | HTTP 201, collection created, batch `totalQuantityKg` incremented, `HONEY_COLLECTED` event added |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | `batchId` and `hiveId` must be UUIDs. `collectionDate` must be a valid ISO 8601 datetime string. |

---

## TC-14: Batch Status Progression — DRAFT → PACKAGED

| Field | Detail |
|---|---|
| **Steps** | PATCH `/api/batches/:id/status` sequentially: `COLLECTED`, `PROCESSING`, `QUALITY_TESTING`, `APPROVED`, `PACKAGED`. Each step requires the previous status to already be set. |
| **Expected** | HTTP 200 for each valid transition. Each step appends a `BatchEvent` with the correct `eventType` and SHA-256 `eventHash`. |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Invalid transitions return HTTP 422 with `INVALID_STATUS_TRANSITION` |

---

## TC-15: Invalid Status Transition

| Field | Detail |
|---|---|
| **Steps** | PATCH `/api/batches/:id/status` with `{status:"SOLD"}` when batch is in `DRAFT` status |
| **Expected** | HTTP 422, `error.code:"INVALID_STATUS_TRANSITION"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-16: Quality Test Submission

| Field | Detail |
|---|---|
| **Steps** | POST `/api/quality` with QUALITY_LAB/ADMIN auth. Body: `{batchId, testDate:"<ISO>", moisturePercent:18.5, status:"PASS", overallGrade:"A", testStandard:"FSSAI"}` |
| **Expected** | HTTP 201, quality test record saved |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-17: QR Code Generation

| Field | Detail |
|---|---|
| **Steps** | POST `/api/batches/:id/qr/generate` with BEEKEEPER/ADMIN auth, after batch is in PACKAGED status |
| **Expected** | HTTP 200, `{qrRecord, qrDataUrl, verificationUrl}`. The `verificationUrl` must be `http://localhost:5173/verify/<publicBatchId>`. The `qrDataUrl` must be a valid base64 PNG. |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Button only appears in UI for PACKAGED or later batches. API returns 422 for earlier statuses. |

---

## TC-18: Blockchain Registration (Hardhat required)

| Field | Detail |
|---|---|
| **Steps** | Start Hardhat node + deploy contract. POST `/api/batches/:id/blockchain/register` with BEEKEEPER auth. |
| **Expected** | HTTP 200, `{success:true, txHash, blockNumber}`. `BlockchainRecord` created with `status:"CONFIRMED"`. |
| **Actual** | N/A (requires Hardhat setup) |
| **Pass/Fail** | N/A |
| **Fix Required** | See Section 10 of RUN_AND_TEST_GUIDE.md for Hardhat setup |

---

## TC-19: Public Verification — Batch Found (Not Blockchain Registered)

| Field | Detail |
|---|---|
| **Steps** | GET `/api/public/verify/<publicBatchId>` (no auth header) |
| **Expected** | HTTP 200, `verificationResult:"NOT_BLOCKCHAIN_REGISTERED"`, `batch` object with producer, collections, processingRecords, qualityTests, events |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-20: Public Verification — Batch Not Found

| Field | Detail |
|---|---|
| **Steps** | GET `/api/public/verify/INVALID-BATCH-ID-XYZ` (no auth header) |
| **Expected** | HTTP 200, `verificationResult:"BATCH_NOT_FOUND"`, `batch:null`. No DB error (FK constraint bug fixed). |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Fixed: removed the broken `consumerVerification.create({batchId:'unknown',...})` call |

---

## TC-21: Frontend Verification Page

| Field | Detail |
|---|---|
| **Steps** | Open `http://localhost:5173/verify/<publicBatchId>` in a browser |
| **Expected** | Page loads without login, shows verification badge (amber "Batch Registered Off-Chain"), Batch Information, Producer, Quality Tests (if any), and Traceability Audit Trail |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-22: QR Scanner — Camera Permission Flow

| Field | Detail |
|---|---|
| **Steps** | Navigate to `http://localhost:5173/verify/scan`. Click "Scan QR Code". |
| **Expected** | Browser prompts for camera permission. After allowing, live camera view opens with amber corner brackets and scan-line animation. |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Must be served over HTTPS or localhost for camera API to work |

---

## TC-23: QR Scanner — Camera Permission Denied

| Field | Detail |
|---|---|
| **Steps** | Click "Scan QR Code", then deny the permission prompt |
| **Expected** | Red error message: "Camera permission was denied..." with instructions. Manual entry fallback becomes available. No fake records shown. |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-24: QR Scanner — Scan Real QR Code

| Field | Detail |
|---|---|
| **Steps** | Generate QR for a PACKAGED batch. Display QR on screen. Open `/verify/scan` on same laptop, click Scan, point camera at QR. |
| **Expected** | Scanner decodes URL, camera stream stops, browser navigates to `/verify/<publicBatchId>`, VerifyPage loads with correct batch data |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | Only works on same machine; use LAN IP for phone testing (see TC-25) |

---

## TC-25: QR Scanner — Physical Phone Scan (LAN)

| Field | Detail |
|---|---|
| **Steps** | Configure LAN IP as described in RUN_AND_TEST_GUIDE.md §11. Generate QR for a PACKAGED batch. Display QR on laptop screen. Scan with phone camera (native camera app or `/verify/scan` on phone). |
| **Expected** | Phone opens `http://192.168.1.42:5173/verify/<publicBatchId>`, batch details load, producer and collection records are correct |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | FRONTEND_URL must be set to LAN IP in backend .env before generating QR |

---

## TC-26: QR Scanner — Manual Entry Fallback

| Field | Detail |
|---|---|
| **Steps** | On `/verify/scan`, click "Or Enter Batch ID Manually", type a valid `publicBatchId`, click "Verify Provenance" |
| **Expected** | Navigates to `/verify/<publicBatchId>`, batch loads |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-27: Batch Update Reflected in Verification Page

| Field | Detail |
|---|---|
| **Steps** | 1) Visit `/verify/<publicBatchId>` and note the status. 2) PATCH the batch status to `IN_DISTRIBUTION`. 3) Reload the verification page. |
| **Expected** | Verification page shows updated status `IN DISTRIBUTION`. New event appears in Traceability Audit Trail. |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-28: Unauthorized Batch Creation

| Field | Detail |
|---|---|
| **Steps** | POST `/api/batches` without any Authorization header |
| **Expected** | HTTP 401, `error: "No authentication token provided"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-29: Role Restriction — Consumer Cannot Create Batch

| Field | Detail |
|---|---|
| **Steps** | Register a user with `role:"CONSUMER"`, login, POST `/api/batches` with the access token |
| **Expected** | HTTP 403, `"Access denied. Required roles: ADMIN, BEEKEEPER, COLLECTION_CENTER"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## TC-30: Rate Limiting

| Field | Detail |
|---|---|
| **Steps** | Send 101 rapid requests to `/api/auth/login` within a 15-minute window |
| **Expected** | Request 101+ returns HTTP 429, `error.code:"RATE_LIMITED"` |
| **Actual** | 🔲 |
| **Pass/Fail** | 🔲 |
| **Fix Required** | — |

---

## Summary Table

| TC | Test | Status |
|---|---|---|
| TC-01 | API Health Check | 🔲 |
| TC-02 | User Registration | 🔲 |
| TC-03 | Duplicate Email | 🔲 |
| TC-04 | Login | 🔲 |
| TC-05 | Invalid Login | 🔲 |
| TC-06 | Beekeeper Profile | 🔲 |
| TC-07 | Hive Registration | 🔲 |
| TC-08 | Hive List | 🔲 |
| TC-09 | IoT Device Registration | 🔲 |
| TC-10 | Telemetry Ingestion | 🔲 |
| TC-11 | Telemetry Alerts | 🔲 |
| TC-12 | Create Batch | 🔲 |
| TC-13 | Honey Collection | 🔲 |
| TC-14 | Status Progression | 🔲 |
| TC-15 | Invalid Transition | 🔲 |
| TC-16 | Quality Test | 🔲 |
| TC-17 | QR Generation | 🔲 |
| TC-18 | Blockchain Registration | N/A |
| TC-19 | Public Verify (found) | 🔲 |
| TC-20 | Public Verify (not found) | 🔲 |
| TC-21 | Frontend Verify Page | 🔲 |
| TC-22 | Camera Permission Flow | 🔲 |
| TC-23 | Camera Permission Denied | 🔲 |
| TC-24 | Scan QR (laptop) | 🔲 |
| TC-25 | Scan QR (phone LAN) | 🔲 |
| TC-26 | Manual Entry Fallback | 🔲 |
| TC-27 | Batch Update → Verify | 🔲 |
| TC-28 | Unauthorized Request | 🔲 |
| TC-29 | Role Restriction | 🔲 |
| TC-30 | Rate Limiting | 🔲 |

---

## Known Issues Found During Audit

| Issue | Severity | Status |
|---|---|---|
| `batchService.publicVerifyBatch` created a `ConsumerVerification` with `batchId:'unknown'`, violating the FK constraint on every invalid QR scan | **Critical** | ✅ Fixed |
| `ScanQrPage.tsx` showed a static camera mock — no real camera integration | **High** | ✅ Fixed (html5-qrcode wired up) |
| QR URL uses `FRONTEND_URL` env var which defaults to `localhost:5173` — will not work when scanned by a physical phone | **High** | Documented in RUN_AND_TEST_GUIDE.md §11 |
| Blockchain features require a running Hardhat node + deployed contract — not auto-started | **Low** | Documented — optional for testing |
| AI features require an external AI service URL — no local fallback | **Info** | Documented — gracefully degraded |
