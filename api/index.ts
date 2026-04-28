// Vercel Edge Function entry — mendelegasikan request ke TanStack Start worker bundle
// Bundle worker dihasilkan oleh `vite build` di dist/server/index.js
// @ts-expect-error - resolved at build time relative to project root
import handler from "../dist/server/index.js";

export const config = {
  runtime: "edge",
};

export default async function (request: Request): Promise<Response> {
  // Worker entry mengekspor default { fetch } atau langsung fetch handler
  const fetchHandler =
    typeof handler === "function"
      ? handler
      : (handler as { fetch: (req: Request) => Promise<Response> }).fetch;
  return fetchHandler(request);
}
