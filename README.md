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

If you'd like, I can:
- Add the Vite proxy to `public/demo_ui/vite.config.js` automatically.
- Make thumbnails and progress indicators in the UI.
- Add server-side public token-less access logs or rate limiting for streaming endpoints.
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
