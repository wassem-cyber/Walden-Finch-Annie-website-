// Recipe Box sync: stores one JSON document per private sync code.
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  const code = new URL(req.url).searchParams.get("code") || "";
  if (!/^[a-z0-9]{10,40}$/.test(code)) return json('{"error":"bad code"}', 400);
  const store = getStore({ name: "recipe-box", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(code);
    return data ? json(data) : json('{"error":"not found"}', 404);
  }
  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > 4500000) return json('{"error":"too big"}', 413);
    try {
      const d = JSON.parse(text);
      if (!d || !Array.isArray(d.R)) throw 0;
    } catch (e) {
      return json('{"error":"bad data"}', 400);
    }
    await store.set(code, text);
    return json('{"ok":true}');
  }
  return json('{"error":"method"}', 405);
};

export const config = { path: "/api/sync" };
