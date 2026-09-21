# Ball

A minimal, tactile 3D magic 8 ball. Twenty classic answers, a Blender-built shell, a floating icosahedral die, and blue optical fluid animated in Three.js. Jev supplies a probability distribution over the answers; the server samples that distribution.

## Run

```sh
bun install
cp .env.example .env
# Set TYPESAFE_API_KEY in .env for live Jev answers.
bun run build
bun run start
```

Open http://localhost:3000. The interface is limited to an “Ask an 8 ball” heading, the ball, and a bottom question field. A server key is required for questions; errors appear inline only when needed. The API retains explicit classic mode for development. `bun run dev` restarts the server on edits; rebuild frontend edits with `bun run build`.

## Validate

```sh
bun test
bun run build
```

The model is in `public/models/ball.glb`. Rendering uses WebGL2, capped device pixel ratio, reduced-motion handling, and a static fallback if WebGL is unavailable. Liquid motion is a real-time optical approximation with damped die movement, not a computational fluid dynamics solver. Question text is sent to TypeSafe AI only when a live question is submitted; validated questions and resulting answers are recorded in structured server logs.

See [API research](README-api.md) for the documented Jev contract, probability interpretation, security limits, and integration tests. Probabilities describe the model's choice of response; they do not establish the actual likelihood of future events.

Drag the ball in any direction to rotate it; the die and liquid respond with damped motion. Arrow keys rotate the focused ball and Home resets the view. Releasing the ball springs the window back toward you with a damped overshoot. Reduced-motion settings disable automatic spin and spring animation while preserving direct manipulation.

Visual direction references the free [shadcn shader gallery](https://www.shadcn.io/shaders), especially smooth noise contours. The atmosphere shader in `src/atmosphere.ts` is original code, shared under MIT (see `SHADERS-LICENSE`); no external shader assets or new runtime dependencies are required. It shares the ball renderer, pauses when hidden, and freezes with reduced motion.

## Cloudflare Workers

`wrangler.jsonc` serves the frontend and same-origin API at `real8ball.com` and `www.real8ball.com`. The Worker uses the encrypted `TYPESAFE_API_KEY` runtime secret; never put it in build variables or source control. The optional `TYPESAFE_MODEL` runtime variable defaults to `jev-latest`.

```sh
bun test
bun run build
bun run worker:check
bun run deploy
# Provision the key interactively once:
bunx wrangler secret put TYPESAFE_API_KEY
```

GitHub Actions validates tests, TypeScript, frontend assets, and the Worker bundle on pushes and pull requests. To enable automatic deployment, connect `kualta/ball` to the `real8ball` Worker's Builds settings: production branch `main`, preview builds disabled, build command `bun install --frozen-lockfile && bun test && bun run build && bun run worker:check`, deploy command `bun run deploy`, root `/`.

Production requests use Cloudflare's client IP and rate-limit binding (12 answer requests per 60 seconds per client, enforced per Cloudflare location). The Bun development server uses its in-memory limiter.
