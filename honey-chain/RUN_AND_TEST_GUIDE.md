# Honey Chain — Run & Test Guide

> All commands and ports are derived from the existing repository. Nothing is invented.

---

## 1. Prerequisites

| Requirement | Version | Download |
|---|---|---|
| Node.js | 18+ LTS | https://nodejs.org |
| npm | 9+ (bundled with Node) | — |
| PostgreSQL | 14+ | https://www.postgresql.org/download/ |

> No global `hardhat` or `ts-node` is needed — both are in `backend/devDependencies`.

---

## 2. Environment Variables

### Backend — `honey-chain/backend/.env`

```bash
cd honey-chain/backend
copy .env.example .env
```

Fill in these values:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/honeychain
JWT_SECRET=at_least_64_random_characters_here
JWT_REFRESH_SECRET=another_64_random_characters_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=
SMART_CONTRACT_ADDRESS=
AI_SERVICE_URL=
AI_SERVICE_API_KEY=
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
IOT_RATE_LIMIT_MAX=1000
LOG_LEVEL=info
```

### Frontend — `honey-chain/frontend/.env`

```bash
cd honey-chain/frontend
copy .env.example .env
```

```env
VITE_API_URL=http://localhost:4000/api
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Honey Chain
```

> Vite already has a /api proxy to port 4000 in vite.config.ts — the frontend never calls localhost:4000 directly from the browser.

---

## 3. Install Dependencies

**Terminal 1 — Backend:**
```powershell
cd "c:\Users\Akash Jaiswal\New folder (6)\HoneyBee\honey-chain\backend"
npm install
```

**Terminal 2 — Frontend:**
```powershell
cd "c:\Users\Akash Jaiswal\New folder (6)\HoneyBee\honey-chain\frontend"
npm install
```

---

## 4. Set Up PostgreSQL

### Start the service (Windows)
```powershell
Start-Service -Name "postgresql*"
```

### Create the database
```powershell
psql -U postgres -c "CREATE DATABASE honeychain;"
```

### Verify
```powershell
psql -U postgres -d honeychain -c "SELECT current_database();"
```

---

## 5. Run Prisma Migrations

In Terminal 1:

```powershell
cd "c:\Users\Akash Jaiswal\New folder (6)\HoneyBee\honey-chain\backend"
npm run prisma:generate
npm run prisma:migrate
```

Enter `init` as the migration name when prompted.

**Optional — seed the database:**
```powershell
npx prisma db seed
```

**Optional — browse the database:**
```powershell
npm run prisma:studio
# Opens http://localhost:5555
```

---

## 6. Start the Application

### Terminal 1 — Backend (port 4000)
```powershell
npm run dev
```

Expected:
```
[info] Database connected successfully
[info] Honey Chain API running { port: 4000, ... }
```

> Blockchain/AI connection warnings are normal — the server runs fine without them.

### Terminal 2 — Frontend (port 5173)
```powershell
npm run dev
```

Expected:
```
  VITE v8.x.x  ready in xxx ms
  Local: http://localhost:5173/
```

---

## 7. Local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| API Health Check | http://localhost:4000/api/public/health |
| Swagger Docs | http://localhost:4000/api/docs |
| Prisma Studio | http://localhost:5555 |

---

## 8. Stop and Restart

Press Ctrl+C in each terminal to stop. Run `npm run dev` to restart.
The database keeps all data between restarts.

---

## 9. Common Errors and Fixes

### Missing environment variable: DATABASE_URL
Create backend/.env from .env.example and set DATABASE_URL.

### Can't reach database server at localhost:5432
PostgreSQL is not running. Run `Start-Service -Name "postgresql*"`.

### EADDRINUSE: address already in use :::4000
```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Prisma P1001: Can't reach database
Check credentials in DATABASE_URL. Confirm the database exists.

### PrismaClientKnownRequestError: Foreign key constraint failed (BATCH_NOT_FOUND path)
This bug has been fixed. The old code attempted to write batchId: 'unknown' to consumer_verifications, violating the FK constraint. The fix removes that DB write.

### Prisma schema mismatch
```powershell
npm run prisma:migrate
```

### Frontend shows Network Error / ERR_CONNECTION_REFUSED
Backend is not running. Start it first.

### Generate QR button is not visible on BatchDetailPage
By design — QR generation is only allowed for batches in PACKAGED, IN_DISTRIBUTION, AT_RETAILER, or SOLD status.

---

## 10. Blockchain (Optional — Hardhat)

```powershell
# Terminal 3
npm run hardhat:node

# Terminal 4
npm run hardhat:compile
npm run hardhat:deploy
```

Copy the deployed contract address into backend/.env:
```env
SMART_CONTRACT_ADDRESS=0x...
BLOCKCHAIN_PRIVATE_KEY=<account 0 private key printed by hardhat:node>
```

Restart the backend.

---

## 11. LAN Testing — QR Code on a Physical Device

To scan a QR code with your phone over Wi-Fi:

### Step 1 — Find your LAN IP
```powershell
ipconfig | findstr "IPv4"
# Example: 192.168.1.42
```

### Step 2 — Update backend/.env
```env
CORS_ORIGIN=http://localhost:5173,http://192.168.1.42:5173
FRONTEND_URL=http://192.168.1.42:5173
```

### Step 3 — Update frontend/.env
```env
VITE_APP_URL=http://192.168.1.42:5173
```

### Step 4 — Bind Vite to all interfaces in frontend/vite.config.ts
```ts
server: {
  host: '0.0.0.0',
  port: 5173,
  proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
}
```

### Step 5 — Restart both servers

Generated QR codes will encode: `http://192.168.1.42:5173/verify/<publicBatchId>`

Your phone must be on the same Wi-Fi network.

> WARNING: localhost in a QR URL only works on the machine running the server. Always use the LAN IP or a public tunnel (e.g., npx localtunnel --port 5173) for physical device testing.

---

## 12. Physical Label Testing

1. Generate a QR code for a batch in PACKAGED status or later (BatchDetailPage > Generate QR button).
2. The PNG auto-downloads.
3. Print on a label sticker and attach to a test honey bottle.
4. Scan with any phone camera.
5. Verify that batch ID, producer, harvest season, collection details, processing records, and quality test status all match the database.

> IMPORTANT: Blockchain verification confirms data integrity, not chemical purity. A QR scan is not a food safety certificate.
