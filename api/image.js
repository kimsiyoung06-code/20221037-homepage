const ALLOWED_HOSTS = new Set(["image-comic.pstatic.net", "comic.naver.com", "webtoon-crawler.nomadcoders.workers.dev"]);

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method Not Allowed");
  }
  const raw = req.query?.url;
  if (typeof raw !== "string" || !raw) return res.status(400).send("Missing image URL");
  let url;
  try { url = new URL(raw); } catch { return res.status(400).send("Invalid image URL"); }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return res.status(403).send("Image host is not allowed");
  }
  try {
    const upstream = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://comic.naver.com/" },
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) return res.status(upstream.status).send("Image upstream returned an error");
    const type = upstream.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return res.status(415).send("Upstream did not return an image");
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(502).send("Could not fetch image: " + (error?.message || "upstream error"));
  }
};
