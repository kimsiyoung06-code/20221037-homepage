// catalogue.js provides 60 demo titles. API data can replace/extend this list if the service is available.
let webtoons = [...seedWebtoons];
let activePlatform="all", activeGenre="all", showOnlySaved=false;
let saved=new Set(JSON.parse(localStorage.getItem("toonPickSaved")||"[]"));
const grid=document.getElementById("webtoonGrid"), searchInput=document.getElementById("searchInput");
const resultCount=document.getElementById("resultCount"), emptyState=document.getElementById("emptyState");
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function normApiItem(x,i){
 const title=x.title||x.titleName||x.name||x.webtoonTitle;
 if(!title)return null;
 const rawPlatform=String(x.provider||x.platform||"").toUpperCase();
 const platform=(rawPlatform==="NAVER"||rawPlatform.includes("NAVER"))?"naver":"kakao";
 const existing=seedWebtoons.find(w=>w.title.trim()===String(title).trim());
 // Korea Webtoon API does not supply genres, so reuse genre labels only for titles
 // already present in the site's sample catalogue; do not invent genres for others.
 const genres=existing ? [...existing.genres] : [];
 let thumbnail=x.thumbnail||x.thumbnailUrl||x.img||x.image||x.cover||x.coverImage||x.imageUrl||null;
 if(Array.isArray(thumbnail))thumbnail=thumbnail[0]||null;
 if(typeof thumbnail==="string"&&thumbnail.startsWith("[")){
   try{const parsed=JSON.parse(thumbnail);if(Array.isArray(parsed))thumbnail=parsed[0]||null;}catch(e){}
 }
 const authors=Array.isArray(x.authors)?x.authors.join(", "):(x.authors||x.author||"작가 정보 없음");
 const updateDays=Array.isArray(x.updateDays)?x.updateDays:[];
 const days={MON:"월",TUE:"화",WED:"수",THU:"목",FRI:"금",SAT:"토",SUN:"일"};
 const status=x.isEnd===true?"완결":(updateDays.length?updateDays.map(d=>days[d]||d).join(", ")+" 연재":"연재/완결 정보 확인 중");
 return {
   id:100000+i,title:String(title),platform,genres,author:authors,status,
   symbol:platform==="naver"?"N":"K",c1:existing?.colors?.[0]||"#343052",
   c2:existing?.colors?.[1]||"#8c7fbd",
   link:x.url|| (platform==="kakao"?"https://webtoon.kakao.com/":"https://comic.naver.com/"),
   image:thumbnail
 };
}
function render(){
 const q=searchInput.value.trim().toLowerCase();
 let list=webtoons.filter(w=>(activePlatform==="all"||w.platform===activePlatform)&&(activeGenre==="all"||w.genres.includes(activeGenre))&&(!q||(w.title+" "+w.author+" "+w.genres.join(" ")).toLowerCase().includes(q))&&(!showOnlySaved||saved.has(w.id)));
 if(document.getElementById("sortSelect").value==="title")list.sort((a,b)=>a.title.localeCompare(b.title,"ko"));
 grid.innerHTML=list.map(w=>`<article class="toon-card"><a class="cover-link" href="${esc(w.link)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(w.title)} 공식 플랫폼에서 보기"><div class="cover ${w.image?"has-image":""}" style="--c1:${w.c1};--c2:${w.c2}">${w.image?`<img loading="lazy" src="${esc(w.image)}" alt="" onerror="this.remove();this.parentElement.classList.remove('has-image')">`:""}<span class="cover-small">${w.platform==="naver"?"NAVER WEBTOON":"KAKAO WEBTOON"}</span><span class="cover-symbol">${esc(w.symbol||"✦")}</span><span class="cover-name">${esc(w.title)}</span></div><span class="platform-tag">${w.platform==="naver"?"N · 네이버":"K · 카카오"}</span></a><button class="heart-btn ${saved.has(w.id)?"saved":""}" data-save="${w.id}" aria-label="찜하기">${saved.has(w.id)?"♥":"♡"}</button><div class="toon-info"><h3 class="toon-title">${esc(w.title)}</h3><div class="toon-sub"><span>${esc(Array.isArray(w.author)?w.author.join(", "):w.author)}</span><span class="dot"></span><span>${esc(w.status)}</span></div><div class="genre-tags">${w.genres.map(g=>`<span>${esc(g)}</span>`).join("")}</div></div></article>`).join("");
 resultCount.textContent=showOnlySaved?`찜한 웹툰 ${list.length}개`:`웹툰 ${list.length}개`;
 emptyState.classList.toggle("hidden",list.length!==0);grid.classList.toggle("hidden",list.length===0);
 document.getElementById("savedCount").textContent=saved.size;
 document.getElementById("showSaved").innerHTML=showOnlySaved?'전체 웹툰 보기 <span>→</span>':'찜한 웹툰 보기 <span>→</span>';
}
document.querySelectorAll("[data-platform]").forEach(b=>b.addEventListener("click",()=>{activePlatform=b.dataset.platform;showOnlySaved=false;document.querySelectorAll("[data-platform]").forEach(x=>x.classList.toggle("active",x===b));render()}));
document.querySelectorAll("[data-genre]").forEach(b=>b.addEventListener("click",()=>{activeGenre=b.dataset.genre;showOnlySaved=false;document.querySelectorAll("[data-genre]").forEach(x=>x.classList.toggle("active",x===b));render()}));
searchInput.addEventListener("input",()=>{showOnlySaved=false;render()});document.getElementById("sortSelect").addEventListener("change",render);
grid.addEventListener("click",e=>{const b=e.target.closest("[data-save]");if(!b)return;const id=Number(b.dataset.save);saved.has(id)?saved.delete(id):saved.add(id);localStorage.setItem("toonPickSaved",JSON.stringify([...saved]));render()});
document.getElementById("resetFilters").addEventListener("click",()=>{activePlatform="all";activeGenre="all";showOnlySaved=false;searchInput.value="";document.querySelectorAll("[data-platform]").forEach(b=>b.classList.toggle("active",b.dataset.platform==="all"));document.querySelectorAll("[data-genre]").forEach(b=>b.classList.toggle("active",b.dataset.genre==="all"));render()});
document.getElementById("showSaved").addEventListener("click",()=>{showOnlySaved=!showOnlySaved;activePlatform="all";activeGenre="all";searchInput.value="";document.querySelectorAll("[data-platform]").forEach(b=>b.classList.toggle("active",b.dataset.platform==="all"));document.querySelectorAll("[data-genre]").forEach(b=>b.classList.toggle("active",b.dataset.genre==="all"));document.getElementById("discover").scrollIntoView({behavior:"smooth"});render()});
const modal=document.getElementById("quizModal");function openQuiz(){modal.classList.remove("hidden")}function closeQuiz(){modal.classList.add("hidden")}
document.getElementById("heroQuiz").addEventListener("click",openQuiz);document.getElementById("closeQuiz").addEventListener("click",closeQuiz);modal.addEventListener("click",e=>{if(e.target===modal)closeQuiz()});
document.querySelectorAll("[data-quiz]").forEach(b=>b.addEventListener("click",()=>{activeGenre=b.dataset.quiz;showOnlySaved=false;document.querySelectorAll("[data-genre]").forEach(x=>x.classList.toggle("active",x.dataset.genre===activeGenre));closeQuiz();document.getElementById("discover").scrollIntoView({behavior:"smooth"});render()}));
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();searchInput.focus()}if(e.key==="Escape")closeQuiz()});
const API_BASE = "https://korea-webtoon-api-cc7dda2f0d77.herokuapp.com";

function extractApiItems(json) {
  if (Array.isArray(json)) return json;
  for (const key of ["webtoons", "data", "items", "results", "content"]) {
    if (Array.isArray(json?.[key])) return json[key];
    if (Array.isArray(json?.[key]?.items)) return json[key].items;
  }
  return null;
}

async function loadApi(){
  const status=document.getElementById("apiStatus"),button=document.getElementById("syncApi");
  status.textContent="공개 웹툰 API에 연결 중…";button.disabled=true;button.textContent="연결 중…";
  try{
    let all = [];
    let usedEndpoint = "";
    let lastError = null;

    // Public API endpoint names can differ between deployed API versions.
    const candidates = [
      `${API_BASE}/webtoons?page=1&perPage=100&sort=ASC`,
      `${API_BASE}/api/webtoons?page=1&perPage=100&sort=ASC`,
      `${API_BASE}/webtoon?page=1&perPage=100&sort=ASC`,
      `${API_BASE}/api/webtoon?page=1&perPage=100&sort=ASC`,
      `${API_BASE}/webtoons`,
      `${API_BASE}/api/webtoons`,
      `${API_BASE}/webtoon`,
      `${API_BASE}/api/webtoon`
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} at ${new URL(url).pathname}`);
          continue;
        }
        const json = await res.json();
        const arr = extractApiItems(json);
        if (arr && arr.length) {
          all = arr;
          usedEndpoint = url;
          break;
        }
        lastError = new Error("응답은 받았지만 웹툰 배열을 찾지 못했습니다.");
      } catch (e) {
        lastError = e;
      }
    }

    if (!all.length) {
      throw new Error(
        "공개 API 주소 또는 응답 형식을 확인하지 못했습니다. " +
        (lastError?.message || "")
      );
    }

    const normalized = all.map(normApiItem).filter(Boolean);
    if (!normalized.length) throw new Error("API 응답에서 제목이 있는 작품을 찾지 못했습니다.");

    const unique = [...new Map(normalized.map(w => [w.platform + "|" + w.title, w])).values()];
    webtoons = unique;
    status.textContent = `API 연결 성공 · 실제 웹툰 ${unique.length}개`;
    document.getElementById("totalCount").textContent = unique.length;
    render();
    console.info("TOON PICK API connected:", usedEndpoint);
  } catch(err) {
    console.error("TOON PICK API connection failed:", err);
    status.textContent = "API 연결 실패 · 공개 서버가 중단됐거나 API 주소/CORS가 변경됐을 수 있어요. 샘플 목록을 표시합니다.";
  } finally {
    button.disabled=false;
    button.textContent="API 데이터 다시 불러오기 ↗";
  }
}
document.getElementById("syncApi").addEventListener("click",loadApi);
// Try loading live API data automatically when the page opens.
loadApi();
document.getElementById("totalCount").textContent=seedWebtoons.length+"+";
render();
