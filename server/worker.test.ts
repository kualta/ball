import { expect, test } from "bun:test";
import worker, { type WorkerEnvironment } from "./worker";
import { jevRequest } from "./api";

function environment(
  overrides: Partial<WorkerEnvironment> = {},
): WorkerEnvironment {
  return {
    ASSETS: {
      fetch: async () =>
        new Response("asset", { headers: { "Content-Type": "text/html" } }),
    },
    ORACLE_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}
const question = (ip: string) =>
  new Request("https://real8ball.com/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: JSON.stringify({ question: "Will today be fun?", demo: true }),
  });

test("Worker reads only its configured secret and never exposes it", async () => {
  const response = await worker.fetch(
    new Request("https://real8ball.com/api/status"),
    environment({ TYPESAFE_API_KEY: "worker-secret" }),
  );
  expect(await response.json()).toEqual({ configured: true });
  const unconfigured = await worker.fetch(
    new Request("https://real8ball.com/api/status"),
    environment(),
  );
  expect(await unconfigured.json()).toEqual({ configured: false });
  expect(jevRequest("Hello?", "custom-model").model).toBe("custom-model");
});

test("Worker applies Cloudflare rate limit to actual client IP before model access", async () => {
  let key = "";
  const response = await worker.fetch(
    question("192.0.2.1"),
    environment({
      ORACLE_RATE_LIMITER: {
        limit: async (options) => {
          key = options.key;
          return { success: false };
        },
      },
    }),
  );
  expect(key).toBe("192.0.2.1");
  expect(response.status).toBe(429);
});

test("Worker fails closed if rate limiting is unavailable", async () => {
  const response = await worker.fetch(
    question("192.0.2.2"),
    environment({
      ORACLE_RATE_LIMITER: {
        limit: async () => {
          throw new Error("unavailable");
        },
      },
    }),
  );
  expect(response.status).toBe(503);
});

test("Worker serves classic answers and preserves origin validation", async () => {
  expect(
    (await worker.fetch(question("192.0.2.3"), environment())).status,
  ).toBe(200);
  const crossOrigin = question("192.0.2.4");
  crossOrigin.headers.set("Origin", "https://other.example");
  expect((await worker.fetch(crossOrigin, environment())).status).toBe(403);
});

test("Worker sends only page requests to assets and preserves security headers", async () => {
  let hits = 0;
  const env = environment({
    ASSETS: {
      fetch: async () => {
        hits++;
        return new Response("page", {
          headers: { "Content-Type": "text/html" },
        });
      },
    },
  });
  const page = await worker.fetch(new Request("https://real8ball.com/"), env);
  expect(await page.text()).toBe("page");
  expect(page.headers.get("Content-Type")).toBe("text/html");
  expect(page.headers.get("X-Frame-Options")).toBe("DENY");
  expect(
    (await worker.fetch(new Request("https://real8ball.com/api/missing"), env))
      .status,
  ).toBe(404);
  expect(
    (
      await worker.fetch(
        new Request("https://real8ball.com/", { method: "POST" }),
        env,
      )
    ).status,
  ).toBe(405);
  expect(hits).toBe(1);
});
