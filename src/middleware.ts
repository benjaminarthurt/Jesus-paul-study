import { defineMiddleware } from "astro:middleware";
import { mountHtml } from "./lib/mount-html.mjs";

export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();
  const base = import.meta.env.BASE_URL;
  if (base === "/" || !response.headers.get("content-type")?.includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(await mountHtml(await response.text(), base), {
    status: response.status, statusText: response.statusText, headers
  });
});
