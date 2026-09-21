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

Open http://localhost:3000. The interface is limited to the Ball header, the ball, and a bottom question field. A server key is required for questions; errors appear inline only when needed. The API retains explicit classic mode for development. `bun run dev` restarts the server on edits; rebuild frontend edits with `bun run build`.

## Validate

```sh
bun test
bun run build
```

The model is in `public/models/ball.glb`. Rendering uses WebGL2, capped device pixel ratio, reduced-motion handling, and a static fallback if WebGL is unavailable. Liquid motion is a real-time optical approximation with damped die movement, not a computational fluid dynamics solver. Question text is sent to TypeSafe AI only when a live question is submitted; the application does not persist questions.

See [API research](README-api.md) for the documented Jev contract, probability interpretation, security limits, and integration tests. Probabilities describe the model's choice of response; they do not establish the actual likelihood of future events.
