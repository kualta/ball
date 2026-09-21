# Jev integration

Research checked against official TypeSafe documentation on 2026-09-21:

- [Quickstart](https://docs.typesafe.ai/introduction/quickstart): bearer authentication, `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`.
- [Choice primitive](https://docs.typesafe.ai/primitives/choice): named `criteria` and a response under `answers.<questionId>` with `choice`, `confidence`, and a probability for every option. Choice supports up to 255 options.

The server asks one Choice question with all twenty traditional responses. User input is isolated in `state.question`; fixed instructions and criteria stay server-side. The app samples the model's validated distribution instead of always selecting its maximum, preserving the oracle's variation. Displayed probabilities are the model's response weights, not verified probabilities of future events.

Set `TYPESAFE_API_KEY` in the server environment. `TYPESAFE_MODEL` optionally overrides `jev-latest`. The key never enters browser code or logs. Runtime needs only Bun, with `@types/bun` for type checking. Run `bun server/index.ts` after building `dist`; default binding is `127.0.0.1:3000`. Set `HOST=0.0.0.0` behind a trusted TLS reverse proxy when deploying.

`GET /api/status` returns `{ "configured": true }` if a server key is present. `POST /api/answer` accepts `{ "question": "Will it rain?" }` and returns `{ answer, probabilities: [{ answer, probability }], source: "jev" }`. A deliberate `demo: true` request selects uniformly among the classic answers and returns `source: "demo"`; this is classic random mode, not an AI result. Without a key normal requests return 503. Upstream failures return 502 rather than manufacturing a result.

Requests are limited to 500 question characters, 4096 body bytes, 12 attempts per minute per direct peer address, eight concurrent upstream requests, and a 20-second upstream deadline. Reverse-proxy deployments share the proxy peer's rate bucket by design; untrusted forwarded headers are ignored. Use an authenticated gateway and deployment-level quota before exposing a paid key broadly. Questions are transmitted to TypeSafe only in Jev mode and are recorded in structured server logs alongside resulting answers.

`bun test` covers malformed model distributions, weighted selection, the documented HTTP shape via a mocked transport, explicit demo behavior, origin checks, body bounds, rate limiting and static path traversal. Live Jev inference needs a real API key; mocked transport tests do not establish live provider success.
