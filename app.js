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
 let thumbnail=x.thumbnail||x.thumbnailUrl||x.thumb||x.img||x.image||x.cover||x.coverImage||x.imageUrl||null;
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
function imageSrc(url){
 if(!url || typeof url !== "string") return "";
 if(url.startsWith("data:") || url.startsWith("blob:")) return url;
 if(url.startsWith("/api/image?")) return url;
 // Route thumbnail requests through our own Vercel function to avoid upstream hotlink/referrer restrictions.
 return "/api/image?url=" + encodeURIComponent(url);
}
function render(){
 const q=searchInput.value.trim().toLowerCase();
 let list=webtoons.filter(w=>(activePlatform==="all"||w.platform===activePlatform)&&(activeGenre==="all"||w.genres.includes(activeGenre))&&(!q||(w.title+" "+w.author+" "+w.genres.join(" ")).toLowerCase().includes(q))&&(!showOnlySaved||saved.has(w.id)));
 if(document.getElementById("sortSelect").value==="title")list.sort((a,b)=>a.title.localeCompare(b.title,"ko"));
 grid.innerHTML=list.map(w=>`<article class="toon-card"><a class="cover-link" href="${esc(w.link)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(w.title)} 공식 플랫폼에서 보기"><div class="cover ${w.image?"has-image":""}" style="--c1:${w.c1};--c2:${w.c2}">${w.image?`<img loading="lazy" src="${esc(imageSrc(w.image))}" alt="${esc(w.title)}" onerror="this.remove();this.parentElement.classList.remove('has-image')">`:""}<span class="cover-small">${w.platform==="naver"?"NAVER WEBTOON":"KAKAO WEBTOON"}</span><span class="cover-symbol">${esc(w.symbol||"✦")}</span><span class="cover-name">${esc(w.title)}</span></div><span class="platform-tag">${w.platform==="naver"?"N · 네이버":"K · 카카오"}</span></a><button class="heart-btn ${saved.has(w.id)?"saved":""}" data-save="${w.id}" aria-label="찜하기">${saved.has(w.id)?"♥":"♡"}</button><div class="toon-info"><h3 class="toon-title">${esc(w.title)}</h3><div class="toon-sub"><span>${esc(Array.isArray(w.author)?w.author.join(", "):w.author)}</span><span class="dot"></span><span>${esc(w.status)}</span></div><div class="genre-tags">${w.genres.map(g=>`<span>${esc(g)}</span>`).join("")}</div></div></article>`).join("");
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
async function loadApi(){
  const status=document.getElementById("apiStatus"),button=document.getElementById("syncApi");
  status.textContent="Vercel API 프록시를 통해 웹툰 정보를 불러오는 중…";
  button.disabled=true;button.textContent="연결 중…";
  try{
    const res=await fetch("/api/webtoons?page=1&perPage=100&sort=ASC",{headers:{Accept:"application/json"}});
    const json=await res.json();
    if(!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    const all=Array.isArray(json) ? json : (json.webtoons || json.data || json.items || json.results || json.content || []);
    if(!Array.isArray(all) || !all.length) throw new Error(json?.error || "API에서 웹툰 목록을 받지 못했습니다.");
    const normalized=all.map(normApiItem).filter(Boolean);
    if(!normalized.length) throw new Error("응답에서 제목이 있는 웹툰을 찾지 못했습니다.");
    const unique=[...new Map(normalized.map(w=>[w.platform+"|"+w.title,w])).values()];
    webtoons=unique;
    status.textContent=json.source === "naver-fallback" ? `API 연결 성공 · 네이버 실제 웹툰 ${unique.length}개 (대체 API)` : `API 연결 성공 · 실제 웹툰 ${unique.length}개`;
    document.getElementById("totalCount").textContent=unique.length;
    render();
  }catch(err){
    console.error("TOON PICK API connection failed:",err);
    status.textContent="API 연결 실패 · Vercel에 배포했는지, 공개 API 서버가 작동하는지 확인하세요. 샘플 목록을 표시합니다.";
  }finally{
    button.disabled=false;
    button.textContent="API 데이터 다시 불러오기 ↗";
  }
}
document.getElementById("syncApi").addEventListener("click",loadApi);
// Vercel 배포 환경에서 페이지를 열면 자동으로 API를 호출합니다.
loadApi();
document.getElementById("totalCount").textContent=seedWebtoons.length+"+";
render();


// 오늘의 웹툰 추첨: 중복 방지 다시 뽑기, 장르 추첨, 최근 기록, 링크 공유
let currentDailyPick = null;
let dailyPickHistory = [];
try { dailyPickHistory = JSON.parse(localStorage.getItem("toonPickDrawHistory") || "[]"); } catch (_) { dailyPickHistory = []; }

function renderDrawHistory() {
  const host = document.getElementById("drawHistory");
  if (!host) return;
  if (!dailyPickHistory.length) {
    host.innerHTML = '<p class="history-empty">아직 추첨 기록이 없어요. 오늘의 웹툰을 뽑아보세요!</p>';
    return;
  }
  host.innerHTML = dailyPickHistory.slice(0, 5).map((item, index) => `
    <button class="history-item" data-history-index="${index}" type="button">
      <span class="history-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="history-title">${esc(item.title)}</span>
      <span class="history-platform">${item.platform === "naver" ? "NAVER" : "KAKAO"}</span>
      <span class="history-date">${esc(item.date || "")}</span>
    </button>`).join("");
  host.querySelectorAll("[data-history-index]").forEach(button => button.addEventListener("click", () => {
    const item = dailyPickHistory[Number(button.dataset.historyIndex)];
    const found = webtoons.find(w => String(w.id) === String(item.id)) || item;
    showDailyPick(found);
  }));
}
function rememberDailyPick(w) {
  const entry = {
    id: w.id, title: w.title, platform: w.platform,
    link: w.link || (w.platform === "naver" ? "https://comic.naver.com/" : "https://webtoon.kakao.com/"),
    genres: w.genres || [], author: w.author || "", status: w.status || "",
    image: w.image || "", c1: w.c1, c2: w.c2,
    date: new Date().toLocaleDateString("ko-KR")
  };
  dailyPickHistory = [entry, ...dailyPickHistory.filter(item => String(item.id) !== String(w.id))].slice(0, 5);
  try { localStorage.setItem("toonPickDrawHistory", JSON.stringify(dailyPickHistory)); } catch (_) {}
  renderDrawHistory();
}
function showDailyPick(w) {
  if (!w) return;
  currentDailyPick = w;
  const coverImage = w.image ? `<img loading="lazy" src="${esc(imageSrc(w.image))}" alt="${esc(w.title)} 표지" onerror="this.remove()">` : "";
  document.getElementById("dailyResult").innerHTML = `
    <div class="daily-result-card">
      <div class="daily-result-cover" style="--c1:${esc(w.c1 || "#343052")};--c2:${esc(w.c2 || "#8c7fbd")}">
        ${coverImage}<span class="result-cover-label">${w.platform==="naver"?"NAVER WEBTOON":"KAKAO WEBTOON"}</span>
        <span class="result-cover-title">${esc(w.title)}</span>
      </div>
      <div class="daily-result-info">
        <h3>${esc(w.title)}</h3>
        <p>플랫폼 · ${w.platform==="naver"?"네이버 웹툰":"카카오웹툰"}</p>
        <p>장르 · ${(w.genres || []).length ? w.genres.map(esc).join(" · ") : "장르 정보 없음"}</p>
        <p>작가 · ${esc(Array.isArray(w.author)?w.author.join(", "):(w.author||"정보 없음"))}</p>
        <p>상태 · ${esc(w.status || "정보 확인 중")}</p>
        <a href="${esc(w.link || (w.platform==="naver"?"https://comic.naver.com/":"https://webtoon.kakao.com/"))}" target="_blank" rel="noopener noreferrer">공식 플랫폼에서 작품 보기 ↗</a>
      </div>
    </div>`;
  document.getElementById("saveDaily").textContent = saved.has(w.id) ? "♥ 이미 찜한 작품" : "♡ 찜 목록에 담기";
  document.getElementById("dailyModal").classList.remove("hidden");
}
function pickRandomWebtoon(genreRandom=false, avoidCurrent=true) {
  let pool = [...webtoons];
  if (genreRandom) {
    const genres = [...new Set(pool.flatMap(w => w.genres || []))];
    if (genres.length) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const genrePool = pool.filter(w => (w.genres || []).includes(genre));
      if (genrePool.length) pool = genrePool;
      const label = document.getElementById("dailyModalTitle");
      if (label) label.textContent = `오늘의 랜덤 장르: ${genre}`;
    }
  } else {
    const label = document.getElementById("dailyModalTitle");
    if (label) label.textContent = "오늘의 웹툰이 도착했어요!";
  }
  if (!pool.length) return;
  if (avoidCurrent && currentDailyPick && pool.length > 1) {
    const alternatives = pool.filter(w => String(w.id) !== String(currentDailyPick.id));
    if (alternatives.length) pool = alternatives;
  }
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  showDailyPick(chosen);
  rememberDailyPick(chosen);
}
function closeDailyPick(){document.getElementById("dailyModal").classList.add("hidden");}
["drawToday","drawTodayMain"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>pickRandomWebtoon(false,false)));
document.getElementById("drawGenre")?.addEventListener("click",()=>pickRandomWebtoon(true,false));
document.getElementById("drawAgain")?.addEventListener("click",()=>pickRandomWebtoon(false,true));
document.getElementById("drawAgainGenre")?.addEventListener("click",()=>pickRandomWebtoon(true,true));
document.getElementById("closeDaily")?.addEventListener("click",closeDailyPick);
document.getElementById("dailyModal")?.addEventListener("click",e=>{if(e.target.id==="dailyModal")closeDailyPick();});
document.getElementById("saveDaily")?.addEventListener("click",()=>{
  if(!currentDailyPick)return;
  if(!saved.has(currentDailyPick.id)){saved.add(currentDailyPick.id);localStorage.setItem("toonPickSaved",JSON.stringify([...saved]));render();}
  document.getElementById("saveDaily").textContent="♥ 찜 목록에 저장됨";
});
document.getElementById("copyDailyLink")?.addEventListener("click",async()=>{
  if(!currentDailyPick)return;
  const link=currentDailyPick.link || (currentDailyPick.platform==="naver"?"https://comic.naver.com/":"https://webtoon.kakao.com/");
  try {
    await navigator.clipboard.writeText(`${currentDailyPick.title} 추천! ${link}`);
    document.getElementById("copyDailyLink").textContent="링크 복사 완료 ✓";
  } catch (_) {
    window.prompt("아래 내용을 복사해 주세요", `${currentDailyPick.title} 추천! ${link}`);
  }
});
document.getElementById("clearDrawHistory")?.addEventListener("click",()=>{
  dailyPickHistory=[];localStorage.removeItem("toonPickDrawHistory");renderDrawHistory();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDailyPick();});
renderDrawHistory();

// BGM: 별도 오디오 파일 없이 Web Audio로 생성하는 잔잔한 반복 앰비언트 멜로디.
// 브라우저 정책상 사용자가 재생 버튼을 눌러야 시작됩니다.
let bgmContext=null, bgmMaster=null, bgmTimer=null, bgmStep=0, bgmPlaying=false;
const melody=[261.63,329.63,392.00,329.63,293.66,349.23,440.00,349.23,261.63,329.63,392.00,493.88,440.00,392.00,329.63,293.66];
function playBgmNote(freq, start, duration, volume, type="sine"){
  const osc=bgmContext.createOscillator(), gain=bgmContext.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,start);
  gain.gain.setValueAtTime(0.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002,volume),start+0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
  osc.connect(gain);gain.connect(bgmMaster);osc.start(start);osc.stop(start+duration+0.04);
}
function bgmTick(){
  if(!bgmPlaying||!bgmContext)return;
  const now=bgmContext.currentTime, vol=Number(document.getElementById("musicVolume").value);
  const note=melody[bgmStep%melody.length];
  playBgmNote(note,now,1.25,vol*0.28,"sine");
  if(bgmStep%4===0)playBgmNote(note/2,now,2.1,vol*0.19,"triangle");
  if(bgmStep%2===1)playBgmNote(note*1.5,now+0.15,0.75,vol*0.07,"sine");
  bgmStep++;
}
async function toggleBgm(){
  const button=document.getElementById("musicToggle"), status=document.getElementById("musicStatus"), dock=document.getElementById("musicDock");
  try{
    if(!bgmContext){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){status.textContent="이 브라우저는 BGM을 지원하지 않아요";return;}bgmContext=new AC();bgmMaster=bgmContext.createGain();bgmMaster.gain.value=1;bgmMaster.connect(bgmContext.destination);}
    if(!bgmPlaying){await bgmContext.resume();bgmPlaying=true;bgmTick();bgmTimer=setInterval(bgmTick,620);button.textContent="Ⅱ";button.setAttribute("aria-label","배경 음악 일시정지");status.textContent="잔잔한 독서 시간 · 재생 중";dock.classList.add("playing");}
    else{bgmPlaying=false;clearInterval(bgmTimer);bgmTimer=null;await bgmContext.suspend();button.textContent="▶";button.setAttribute("aria-label","배경 음악 재생");status.textContent="잔잔한 독서 시간 · 일시정지";dock.classList.remove("playing");}
  }catch(err){status.textContent="BGM 재생을 시작할 수 없어요";console.warn(err);}
}
document.getElementById("musicToggle")?.addEventListener("click",toggleBgm);
document.getElementById("musicVolume")?.addEventListener("input",e=>{if(bgmMaster)bgmMaster.gain.value=1;});


// 기분 기반 추천: 선택한 기분을 장르 필터와 연결
const moodMessages = {
  "액션":"에너지 충전! 액션 웹툰을 모아봤어요.",
  "로맨스":"설렘이 필요한 날, 로맨스 웹툰을 골라봤어요.",
  "일상":"잠깐 쉬어가기 좋은 일상 웹툰을 찾아봐요.",
  "스릴러":"긴장감 있는 이야기를 찾고 있군요.",
  "판타지":"새로운 세계로 떠날 판타지 작품을 골라봐요.",
  "개그":"가볍게 웃을 수 있는 개그 작품을 찾아봐요."
};
document.querySelectorAll("[data-mood]").forEach(button=>button.addEventListener("click",()=>{
  const genre=button.dataset.mood;
  activeGenre=genre; activePlatform="all"; showOnlySaved=false; searchInput.value="";
  document.querySelectorAll("[data-platform]").forEach(x=>x.classList.toggle("active",x.dataset.platform==="all"));
  document.querySelectorAll("[data-genre]").forEach(x=>x.classList.toggle("active",x.dataset.genre===genre));
  document.getElementById("discover").scrollIntoView({behavior:"smooth"});
  render();
  const status=document.getElementById("apiStatus");
  status.textContent=moodMessages[genre] || "기분에 맞는 장르를 골랐어요.";
}));

// 화면 모드 설정 저장
const themeToggle=document.getElementById("themeToggle");
function applyTheme(theme){
  document.body.classList.toggle("dark-mode",theme==="dark");
  if(themeToggle)themeToggle.textContent=theme==="dark"?"☀ 밝은 화면":"☾ 어두운 화면";
}
let savedTheme="light";
try{savedTheme=localStorage.getItem("toonPickTheme")||"light";}catch(_){}
applyTheme(savedTheme);
themeToggle?.addEventListener("click",()=>{
  const next=document.body.classList.contains("dark-mode")?"light":"dark";
  applyTheme(next);try{localStorage.setItem("toonPickTheme",next);}catch(_){}
});

// 찜 목록 내보내기: 별도 서버 없이 텍스트로 백업
 document.getElementById("exportSaved")?.addEventListener("click",()=>{
  const list=webtoons.filter(w=>saved.has(w.id));
  if(!list.length){alert("먼저 웹툰 카드의 ♡ 버튼을 눌러 작품을 찜해 주세요.");return;}
  const lines=["TOON PICK - 나의 찜 목록","내보낸 날짜: "+new Date().toLocaleString("ko-KR"),"",...list.map((w,i)=>`${i+1}. ${w.title} | ${w.platform==="naver"?"네이버 웹툰":"카카오웹툰"} | ${(w.genres||[]).join(", ")} | ${w.link||""}`)];
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="toon-pick-saved-list.txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
});
