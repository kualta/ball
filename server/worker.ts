import {
  handleApiRequest,
  securityHeaders,
  type OracleEnvironment,
  type RateLimiter,
} from "./api";

export interface WorkerEnvironment extends OracleEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  ORACLE_RATE_LIMITER: RateLimiter;
}

export default {
  async fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
    const api = await handleApiRequest(
      request,
      request.headers.get("CF-Connecting-IP") || "unknown",
      env,
      env.ORACLE_RATE_LIMITER,
    );
    if (api) return api;
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(securityHeaders))
      headers.set(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
