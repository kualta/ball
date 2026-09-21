import { resolve, sep } from "node:path";
import { handleApiRequest, json, securityHeaders } from "./api";
export { getAnswer, jevRequest } from "./api";

export async function handleRequest(
  request: Request,
  client = "local",
): Promise<Response> {
  const api = await handleApiRequest(request, client, {
    TYPESAFE_API_KEY: process.env.TYPESAFE_API_KEY,
    TYPESAFE_MODEL: process.env.TYPESAFE_MODEL,
  });
  if (api) return api;
  const url = new URL(request.url);
  const root = resolve(import.meta.dir, "../dist");
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return json({ error: "Invalid path." }, 400);
  }
  const filePath = resolve(root, `.${pathname}`);
  if (!filePath.startsWith(root + sep) && filePath !== root)
    return json({ error: "Not found." }, 404);
  let file = Bun.file(filePath);
  if (!(await file.exists())) {
    if (pathname.includes(".")) return json({ error: "Not found." }, 404);
    file = Bun.file(resolve(root, "index.html"));
  }
  if (!(await file.exists()))
    return json({ error: "Build the app first with bun run build." }, 503);
  return new Response(request.method === "HEAD" ? null : file, {
    headers: securityHeaders,
  });
}

if (import.meta.main) {
  const server = Bun.serve({
    hostname: process.env.HOST || "127.0.0.1",
    port: Number(process.env.PORT || 3000),
    maxRequestBodySize: 4096,
    idleTimeout: 30,
    fetch: (request, server) =>
      handleRequest(request, server.requestIP(request)?.address || "unknown"),
  });
  console.log(`Ball listening on ${server.url}`);
}
