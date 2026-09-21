import { expect, spyOn, test } from "bun:test";
import { handleApiRequest } from "./api";

function request(demo: boolean) {
  return new Request("https://real8ball.com/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "Will the logs work?", demo }),
  });
}

test("question and answer logs share an ID without leaking credentials", async () => {
  const info = spyOn(console, "info").mockImplementation(() => {});
  try {
    const response = await handleApiRequest(request(true), "logging-success", {
      TYPESAFE_API_KEY: "secret-test-key",
    });
    expect(response?.status).toBe(200);
    const records = info.mock.calls.map(([record]) => record);
    expect(records[0]).toMatchObject({
      event: "oracle_question",
      question: "Will the logs work?",
    });
    expect(records[1]).toMatchObject({
      event: "oracle_answer",
      requestId: records[0].requestId,
      source: "demo",
      status: 200,
    });
    expect(JSON.stringify(records)).not.toContain("secret-test-key");
  } finally {
    info.mockRestore();
  }
});

test("upstream failures log status but never response bodies or credentials", async () => {
  const info = spyOn(console, "info").mockImplementation(() => {});
  const error = spyOn(console, "error").mockImplementation(() => {});
  const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("private-upstream-body", { status: 429 }),
  );
  try {
    const response = await handleApiRequest(request(false), "logging-failure", {
      TYPESAFE_API_KEY: "secret-test-key",
    });
    expect(response?.status).toBe(502);
    expect(error.mock.calls[0][0]).toMatchObject({
      event: "oracle_failure",
      requestId: info.mock.calls[0][0].requestId,
      reason: "upstream_http_error",
      upstreamStatus: 429,
    });
    const logs = JSON.stringify([...info.mock.calls, ...error.mock.calls]);
    expect(logs).not.toContain("private-upstream-body");
    expect(logs).not.toContain("secret-test-key");
  } finally {
    info.mockRestore();
    error.mockRestore();
    fetchMock.mockRestore();
  }
});
