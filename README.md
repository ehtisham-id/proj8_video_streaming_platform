# Video Streaming Platform — Local README

This repository contains a NestJS backend for a video streaming platform and a small React demo UI located in `public/demo_ui`.

This README summarizes the public API endpoints, how the demo UI communicates with the backend, and how to run everything locally.

---

## Key endpoints

- `POST /auth/register` — register a new user. Request body: `{ email, password, name }`.
- `POST /auth/login` — login, returns `{ accessToken, refreshToken }`.
- `POST /auth/refresh` — refresh tokens.
- `POST /auth/logout` — logout (requires Bearer JWT).

- `GET /videos` — list all available videos (public).
- `GET /videos/:id` — get metadata for a single video, including a `url` field (presigned URL or HLS master). This endpoint is public — no login required. Response includes `playable: true|false`.
- `POST /videos/upload` — upload a video file (protected — requires Bearer JWT). Multipart form `video` file and optional `title`.
- `DELETE /videos/:id` — delete a video (protected — requires Bearer JWT and owner check).

- `GET /stream/:videoId/master.m3u8` — serve HLS master playlist for the given video (public).
- `GET /stream/:videoId/:quality/playlist.m3u8` — quality playlist (public).
- `GET /stream/:videoId/:quality/segment/:seq.ts` — TS segment (public) — supports Range requests.

- `GET /metrics` — Prometheus metrics endpoint (exposed in `main.ts` and also available via `MetricsController`).
- `GET /metrics/streaming` — simplified JSON view with `total_requests`, `streaming_bandwidth`, `active_streams`.

- `GET /health` — basic health check.
- `GET /health/detailed` — observability health with metrics snapshot.

Other modules (users, subscriptions, redis) have their own endpoints — authenticated where relevant. See the controller sources in `src/` for details.

---

## Demo UI (public/demo_ui)

The demo UI provides a minimal frontend to:
- Upload videos (requires login)
- Browse available videos (no login required)
- Play streamed videos (HLS or presigned HLS URL)

Important notes:
- The UI dev server runs on port `5500` (configured in `public/demo_ui/vite.config.js`).
- By default the UI sends API requests to the same origin (`/videos`, `/auth/login`). When running the UI with `vite` (different origin), either run a proxy or set `ALLOWED_ORIGINS` in the backend to include `http://localhost:5500`.

Run the UI locally:
```bash
cd public/demo_ui
npm install
npm run dev
```

Run the backend (from repo root):
```bash
npm install
npm run start:dev
```

If you run the backend on a different origin (e.g. `http://localhost:3000`), update `public/demo_ui/vite.config.js` to add a `proxy` so client requests are forwarded to the API, or configure your reverse proxy appropriately.

Example `vite.config.js` proxy snippet (if backend runs at localhost:3000):

```js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5500,
    proxy: {
      '/videos': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/stream': 'http://localhost:3000',
      '/metrics': 'http://localhost:3000',
    },
  },
});
```

---

## Security/Access

- Public access: `GET /videos`, `GET /videos/:id`, and all `/stream/*` HLS/segment endpoints are intentionally public so end users can watch videos without logging in.
- Protected actions: `POST /videos/upload` and `DELETE /videos/:id` require Bearer JWT and are enforced server-side.

Make sure to secure MinIO/S3 presigned URLs appropriately and to validate ownership on delete operations (already enforced in the backend).

---

## Troubleshooting

- If the UI cannot fetch `/videos` or streaming endpoints, ensure the backend CORS allows `http://localhost:5500` (set `ALLOWED_ORIGINS` environment variable or use a proxy).
- If playback fails, confirm that the returned `url` for a video is either an HLS `.m3u8` URL or that the `stream` endpoints can be used by the player (HLS player expects CORS headers — the streaming controller sets `Access-Control-Allow-Origin: *`).

---