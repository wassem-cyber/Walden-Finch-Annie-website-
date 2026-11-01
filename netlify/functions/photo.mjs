// Recipe Box photos: stored once in Netlify Blobs so recipes only keep a short link.
import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "recipe-photos", consistency: "strong" });

export default async (req) => {
  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!/^[a-z0-9]{16,40}$/.test(id)) return new Response("bad id", { status: 400 });
    const data = await store().get(id, { type: "arrayBuffer" });
    if (!data) return new Response("not found", { status: 404 });
    return new Response(data, {
      headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
    });
  }
  if (req.method === "POST") {
    const buf = await req.arrayBuffer();
    const b = new Uint8Array(buf);
    if (b.length < 100 || b.length > 3000000) return new Response('{"error":"bad size"}', { status: 413 });
    if (b[0] !== 0xff || b[1] !== 0xd8) return new Response('{"error":"not a jpeg"}', { status: 400 });
    const id = crypto.randomUUID().replace(/-/g, "");
    await store().set(id, buf);
    return new Response(JSON.stringify({ url: "/api/photo?id=" + id }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return new Response("method", { status: 405 });
};

export const config = { path: "/api/photo" };
