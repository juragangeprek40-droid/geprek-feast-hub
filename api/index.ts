// Vercel Serverless (Node.js) Function entry — mendelegasikan request ke TanStack Start worker bundle.
// Bundle worker dihasilkan oleh `vite build` di dist/server/index.js.
// Catatan: kita pakai runtime "nodejs" (bukan "edge") karena bundle SSR
// menggunakan API Node seperti `node:stream` / `node:stream/web` yang tidak
// tersedia di Vercel Edge Runtime.
// @ts-expect-error - resolved at build time relative to project root
import handler from "../dist/server/index.js";

export const config = {
  runtime: "nodejs",
};

type FetchHandler = (req: Request) => Promise<Response> | Response;

const fetchHandler: FetchHandler =
  typeof handler === "function"
    ? (handler as FetchHandler)
    : (handler as { fetch: FetchHandler }).fetch;

// Convert Node IncomingMessage/ServerResponse <-> Web Request/Response
import type { IncomingMessage, ServerResponse } from "node:http";

function buildRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? "localhost";
  const protocol =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const url = `${protocol}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else if (value != null) headers.set(key, String(value));
  }

  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  return new Request(url, {
    method,
    headers,
    body: hasBody ? (req as unknown as ReadableStream) : undefined,
    // @ts-expect-error - Node 18+ requires duplex for streamed bodies
    duplex: hasBody ? "half" : undefined,
  });
}

async function sendResponse(res: ServerResponse, webRes: Response) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

export default async function (req: IncomingMessage, res: ServerResponse) {
  try {
    const request = buildRequest(req);
    const response = await fetchHandler(request);
    await sendResponse(res, response);
  } catch (err) {
    console.error("[api/index] handler error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
