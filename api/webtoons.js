const PRIMARY_API = "https://korea-webtoon-api-cc7dda2f0d77.herokuapp.com";
const NAVER_FALLBACK_API = "https://webtoon-crawler.nomadcoders.workers.dev/today";

function extractItems(json) {
  if (Array.isArray(json)) return json;
  for (const key of ["webtoons", "data", "items", "results", "content"]) {
    if (Array.isArray(json?.[key])) return json[key];
    if (Array.isArray(json?.[key]?.items)) return json[key].items;
  }
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "GET 요청만 허용됩니다." });
  }

  // First try the original multi-platform API.
  const candidates = [
    "/webtoons?page=1&perPage=100&sort=ASC",
    "/api/webtoons?page=1&perPage=100&sort=ASC",
    "/webtoon?page=1&perPage=100&sort=ASC",
    "/api/webtoon?page=1&perPage=100&sort=ASC",
    "/webtoons", "/api/webtoons", "/webtoon", "/api/webtoon"
  ];
  let lastError = "원본 다중 플랫폼 API에 연결하지 못했습니다.";

  for (const path of candidates) {
    try {
      const upstream = await fetch(PRIMARY_API + path, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(7000)
      });
      if (!upstream.ok) {
        lastError = `원본 API HTTP ${upstream.status} (${path})`;
        continue;
      }
      const json = await upstream.json();
      const items = extractItems(json);
      if (items?.length) {
        return res.status(200).json({ source: "korea-webtoon-api", webtoons: items });
      }
      lastError = `원본 API 응답에 웹툰 목록이 없습니다 (${path})`;
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }

  // Fallback: real Naver Webtoon listings from an alternate public endpoint.
  try {
    const upstream = await fetch(NAVER_FALLBACK_API, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) throw new Error(`대체 네이버 API HTTP ${upstream.status}`);
    const json = await upstream.json();
    const items = extractItems(json);
    if (!items?.length) throw new Error("대체 API에서 웹툰 목록을 찾지 못했습니다.");
    const webtoons = items.map((item) => ({
      id: item.id,
      title: item.title,
      provider: "NAVER",
      platform: "NAVER",
      thumbnail: item.thumb || item.thumbnail || item.image || null,
      url: item.id ? `https://comic.naver.com/webtoon/list?titleId=${encodeURIComponent(item.id)}` : "https://comic.naver.com/",
      authors: item.author || item.authors || "",
      updateDays: item.updateDays || []
    }));
    return res.status(200).json({
      source: "naver-fallback",
      notice: "대체 API에서 네이버 웹툰 데이터를 불러왔습니다. 카카오 데이터는 원본 API 복구 시 함께 제공됩니다.",
      webtoons
    });
  } catch (error) {
    return res.status(502).json({
      error: "웹툰 API 연결에 실패했습니다.",
      detail: `${lastError}; 대체 API: ${error?.message || "연결 실패"}`
    });
  }
};
