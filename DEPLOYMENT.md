# Deployment Guide: Bibilava / Neon Snake on Render

This guide outlines step-by-step instructions to deploy the **Bibilava / Neon Snake** multiplayer game to [Render](https://render.com) directly from its GitHub repository.

---

## 1. Architecture Overview

- **Service Type**: Single Unified Web Service (Full-Stack).
- **Backend**: Node.js (`server.ts`) with Express and Socket.IO for real-time private rooms, chat, game physics tick loop (60 FPS), and WebRTC signaling.
- **Frontend**: Vite + React SPA with Three.js / React Three Fiber and Tailwind CSS.
- **Serving Strategy**: During the build phase, `vite build` bundles the client into `/dist`. In production (`NODE_ENV=production`), Express statically serves `/dist` and provides wildcard SPA fallback (`* -> /dist/index.html`), allowing backend APIs, WebSockets, and the frontend to run seamlessly on a single port.

---

## 2. Render Web Service Configuration

When creating a new service in the Render dashboard:

| Setting | Value |
|---|---|
| **Service Type** | **Web Service** |
| **Environment / Runtime** | **Node** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Health Check Path** | `/api/health` |
| **Auto-Deploy** | `Yes` (deploys on every git push) |

> **Note on Start Command**: `npm run start` executes `NODE_ENV=production tsx server.ts`. The `tsx` runtime is included in `dependencies` to ensure it is always available in production.

---

## 3. Environment Variables

Configure these in the **Environment** section of your Render Web Service:

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Enables production mode, builds static file serving, and skips dev middleware. |
| `PORT` | Auto-injected | `10000` | Render automatically sets this. The server binds to `0.0.0.0:${PORT}`. |
| `ALLOWED_ORIGIN` | Optional | `*` | Allowed CORS origin for Socket.IO. Defaults to `*` or set to your Render URL (e.g., `https://bibilava.onrender.com`). |
| `VITE_SERVER_URL` | Optional | *Empty* | Leave empty when serving frontend and backend from the same Render service (same-origin). Set only if frontend is hosted separately on an external CDN. |

---

## 4. Step-by-Step GitHub Deployment

1. **Push Changes to GitHub**:
   Ensure all changes are committed and pushed to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare server and build scripts for Render deployment"
   git push origin main
   ```

2. **Connect Repository in Render**:
   - Log into [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** and select **Web Service**.
   - Connect your GitHub account and select the `Bibilava / Neon Snake` repository.

3. **Configure Build & Runtime Settings**:
   - **Name**: e.g. `bibilava-neon-snake`
   - **Region**: Choose the region closest to your players (e.g., Frankfurt, Oregon, Ohio, Singapore) to minimize WebSocket latency.
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

4. **Add Environment Variables**:
   - Under **Environment Variables**, add:
     - Key: `NODE_ENV`, Value: `production`

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will clone your repository, run `npm install && npm run build`, and launch the service with `npm run start`.
   - The build output will show `vite build` compiling chunks to `dist/`, followed by:
     ```
     Server running in PRODUCTION on http://0.0.0.0:10000
     ```

---

## 5. Testing the Public Deployment

Once Render displays **Live**:

1. **Verify Health Endpoint**:
   Visit:
   ```
   https://<your-render-subdomain>.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "bibilava-neon-snake",
     "activeRooms": 0,
     "uptimeSeconds": 15,
     "timestamp": 1730275500000,
     "env": "production"
   }
   ```

2. **Test Private Lobby & Multi-User Play**:
   - Open `https://<your-render-subdomain>.onrender.com` in Browser Session A.
   - Click **CREATE PRIVATE ROOM** and enter your nickname (e.g. `AliceHost`).
   - Copy the generated 5-character Room Code (or click **Copy Invite Link**).
   - Open an incognito window or second device (Browser Session B) with the invite link:
     `https://<your-render-subdomain>.onrender.com/?room=CODE`
   - Verify that Session B joins the room, both players appear in the roster, chat messages sync in real time, and clicking **START ARENA MATCH** starts the 3D game arena.

---

## 6. Architecture Note: In-Memory State vs. Persistent Storage

- **Current State Strategy**: Game rooms, active match tick states, in-lobby chat logs, and snake positions are held in memory (`rooms: Record<string, InternalRoom>`).
- **Why In-Memory is Used**:
  - The game runs an authoritative 60 updates-per-second tick rate (`TICK_RATE = 60`). In-memory lookups provide sub-millisecond execution without database I/O bottlenecks.
  - Matches are ephemeral 3–5 minute sessions.
- **Behavior on Server Restart**:
  - If the Render service restarts (e.g., during a new deployment or after free-tier spin down), active room matches will reset.
  - A 30-second grace period is implemented for temporary client disconnections and page refreshes so active players do not lose their room during network handoffs.
- **When Persistent Storage is Needed**:
  - If future features require permanent user accounts, saved progression, or global historical leaderboards, a persistent database (such as PostgreSQL on Render) can be added.
