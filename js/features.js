// features.js — 오늘의 추첨 · 웹툰 월드컵 · 작품 상세(별점/한줄평/비슷한 작품) · 최근 본 작품 · 취향 리포트 · 커뮤니티 게시판
// app.js 다음에 로드되며 app.js의 webtoons, saved, render, toggleSave, esc를 사용한다. 모든 기록은 이 브라우저(localStorage)에만 저장된다.
const GENRES=["액션","로맨스","판타지","스릴러","개그","일상"];
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const $=s=>document.querySelector(s);
const keyOf=w=>w.platform+"|"+w.title;
const byKey=k=>webtoons.find(w=>keyOf(w)===k);
const platformName=w=>w.platform==="naver"?"네이버 웹툰":"카카오웹툰";
const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
function todayStr(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function hashStr(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function timeAgo(ts){const s=(Date.now()-ts)/1000;if(s<60)return"방금 전";if(s<3600)return Math.floor(s/60)+"분 전";if(s<86400)return Math.floor(s/3600)+"시간 전";if(s<604800)return Math.floor(s/86400)+"일 전";const d=new Date(ts);return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`}
let toastTimer;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}
function coverHTML(w){return `<div class="cover ${w.image?"has-image":""}" style="--c1:${esc(w.c1)};--c2:${esc(w.c2)}">${w.image?`<img loading="lazy" src="${esc(w.image)}" alt="" onerror="this.remove();this.parentElement.classList.remove('has-image')">`:""}<span class="cover-small">${w.platform==="naver"?"NAVER WEBTOON":"KAKAO WEBTOON"}</span><span class="cover-symbol">${esc(w.symbol||"✦")}</span><span class="cover-name">${esc(w.title)}</span></div>`}
function genreTags(w){return `<div class="genre-tags">${w.genres.length?w.genres.map(g=>`<span>${esc(g)}</span>`).join(""):"<span>장르 정보 없음</span>"}</div>`}

/* ---------- 사용자 ---------- */
// 브라우저마다 고유 id를 만들어 "내가 쓴 글/댓글"만 삭제할 수 있게 한다.
const clientId=(()=>{let id=store.get("toonPickClientId",null);if(!id){id="u"+Math.random().toString(36).slice(2,10);store.set("toonPickClientId",id)}return id})();
const currentUser=()=>store.get("toonPickCurrentUser",null);
const displayName=()=>currentUser()?.nickname||("익명 "+clientId.slice(-4).toUpperCase());
const topActions=$(".top-actions"),guestActions=topActions.innerHTML;
function renderUser(){
 const u=currentUser();
 if(!u){topActions.innerHTML=guestActions;return}
 topActions.innerHTML=`<span class="user-chip">☺ <b>${esc(u.nickname)}</b>님</span><button class="login-link logout-btn" id="logoutBtn">로그아웃</button>`;
 $("#logoutBtn").addEventListener("click",()=>{localStorage.removeItem("toonPickCurrentUser");renderUser();renderBoard();toast("로그아웃했어요.")});
}

/* ---------- 별점 · 최근 본 작품 ---------- */
const getRatings=()=>store.get("toonPickRatings",{});
function ratingOf(w){return getRatings()[keyOf(w)]||0}
function setRating(w,n){const r=getRatings();if(r[keyOf(w)]===n)delete r[keyOf(w)];else r[keyOf(w)]=n;store.set("toonPickRatings",r)}
function addRecent(w){
 if(!w)return;
 const r=store.get("toonPickRecent",[]).filter(k=>k!==keyOf(w));r.unshift(keyOf(w));
 store.set("toonPickRecent",r.slice(0,12));renderReport();
}

/* ---------- 오늘의 추첨 ---------- */
const DRAW_KEY="toonPickDraw",MAX_REROLL=3;
let drawCurrent=null,drawSpinning=false;
function drawState(){let s=store.get(DRAW_KEY,null);if(!s||s.date!==todayStr())s={date:todayStr(),rerolls:MAX_REROLL,history:[]};return s}
function drawPool(){const g=$("#drawGenre").value,p=webtoons.filter(w=>g==="all"||w.genres.includes(g));return p.length?p:webtoons}
function initDraw(){
 const s=drawState();
 drawCurrent=s.history.map(byKey).filter(Boolean).pop()||null;
 // 같은 날에는 누구나 같은 "오늘의 픽"을 받도록 날짜로 고정 추첨한다.
 if(!drawCurrent){drawCurrent=webtoons[hashStr(todayStr())%webtoons.length];s.history=[keyOf(drawCurrent)];store.set(DRAW_KEY,s)}
 const d=new Date();$("#drawDate").innerHTML=`<b>${d.getMonth()+1}월 ${d.getDate()}일</b> ${"일월화수목금토"[d.getDay()]}요일`;
 renderDraw();
}
function renderDraw(){
 const w=drawCurrent,s=drawState(),r=ratingOf(w);
 $("#drawCard").innerHTML=coverHTML(w);
 $("#drawInfo").innerHTML=`<span class="draw-badge">${s.history.length>1?"다시 뽑은 작품":"오늘의 픽"}</span><h3>${esc(w.title)}</h3><p class="draw-meta">${platformName(w)} · ${esc(w.author)} · ${esc(w.status)}</p>${genreTags(w)}${r?`<p class="my-rating">내 별점 <b>${stars(r)}</b></p>`:""}<a class="text-link" href="${esc(w.link)}" target="_blank" rel="noopener noreferrer" data-recent>공식 페이지에서 보기 ↗</a>`;
 $("#drawLeft").textContent=s.rerolls>0?`오늘 남은 다시 뽑기 ${s.rerolls}회`:"오늘의 다시 뽑기를 모두 사용했어요. 내일 또 만나요!";
 $("#drawAgain").disabled=s.rerolls<=0||drawSpinning;
 $("#drawHistory").innerHTML=s.history.map(byKey).filter(Boolean).map(h=>`<button data-detail-key="${esc(keyOf(h))}">${esc(h.title)}</button>`).join("");
 updateDrawSave();
}
function updateDrawSave(){const on=saved.has(drawCurrent.id),b=$("#drawSave");b.textContent=on?"♥ 찜 완료":"♡ 찜하기";b.classList.toggle("on",on)}
function reroll(){
 const s=drawState();if(s.rerolls<=0||drawSpinning)return;
 const pool=drawPool(),card=$("#drawCard");
 drawSpinning=true;$("#drawAgain").disabled=true;card.classList.add("spinning");
 const spin=setInterval(()=>{card.innerHTML=coverHTML(pool[Math.floor(Math.random()*pool.length)])},80);
 setTimeout(()=>{
  clearInterval(spin);
  const cands=pool.filter(w=>w!==drawCurrent),next=cands.length?cands[Math.floor(Math.random()*cands.length)]:pool[0];
  drawCurrent=next;s.rerolls--;s.history.push(keyOf(next));store.set(DRAW_KEY,s);
  drawSpinning=false;card.classList.remove("spinning");card.classList.add("pop");setTimeout(()=>card.classList.remove("pop"),500);
  renderDraw();toast(`🎉 「${next.title}」 당첨!`);
 },1300);
}

/* ---------- 웹툰 월드컵 ---------- */
const WC_KEY="toonPickWorldcup";
let wc=null,wcBusy=false;
function renderWc(){
 const box=$("#wcBox");
 if(!wc){
  const wins=store.get(WC_KEY,[]).map(x=>byKey(x.key)).filter(Boolean);
  box.innerHTML=`<div class="wc-intro"><div class="wc-trophy">🏆</div><h3>나의 최애 웹툰은?</h3><p>무작위로 뽑힌 작품들이 1:1로 맞붙어요. 더 끌리는 쪽을 골라 줘.</p>
  <div class="wc-options"><label>라운드<select id="wcSize"><option value="8">8강</option><option value="16" selected>16강</option><option value="32">32강</option></select></label><label>장르<select id="wcGenre"><option value="all">전체 장르</option>${GENRES.map(g=>`<option>${g}</option>`).join("")}</select></label></div>
  <button class="primary-btn" id="wcStart">월드컵 시작 <span>→</span></button>
  ${wins.length?`<div class="wc-wins"><span>역대 우승작</span>${wins.map(w=>`<button data-detail-key="${esc(keyOf(w))}">🏆 ${esc(w.title)}</button>`).join("")}</div>`:""}</div>`;
  return;
 }
 if(wc.round.length===1){
  const w=wc.round[0];
  box.innerHTML=`<div class="wc-winner"><div class="eyebrow">CHAMPION</div><h3>🏆 당신의 최애는</h3><div class="wc-win-card">${coverHTML(w)}</div><h4>${esc(w.title)}</h4><p>${platformName(w)} · ${esc(w.author)}</p>
  <div class="draw-actions center"><button class="ghost-btn ${saved.has(w.id)?"on":""}" data-wc-save>${saved.has(w.id)?"♥ 찜 완료":"♡ 찜하기"}</button><button class="ghost-btn" data-detail-key="${esc(keyOf(w))}">상세 보기</button><button class="primary-btn" id="wcReset">다시 하기 <span>↻</span></button></div></div>`;
  return;
 }
 const n=wc.round.length,done=wc.idx/2,total=n/2,pair=[wc.round[wc.idx],wc.round[wc.idx+1]];
 box.innerHTML=`<div class="wc-head"><b>${n===2?"결승":n+"강"}</b><span>${done+1} / ${total}</span><div class="wc-progress"><i style="width:${done/total*100}%"></i></div><button class="text-btn" id="wcQuit">그만하기</button></div>
 <div class="wc-match">${pair.map((w,i)=>`<button class="wc-pick" data-pick="${i}">${coverHTML(w)}<span class="wc-name">${esc(w.title)}</span><span class="wc-sub">${platformName(w)} · ${esc(w.genres.join(", ")||"장르 정보 없음")}</span></button>${i===0?'<div class="wc-vs">VS</div>':""}`).join("")}</div>`;
}
function wcStart(){
 const size=Number($("#wcSize").value),g=$("#wcGenre").value,pool=webtoons.filter(w=>g==="all"||w.genres.includes(g));
 if(pool.length<2){toast("이 장르에는 작품이 부족해요.");return}
 let n=2;while(n*2<=Math.min(size,pool.length))n*=2;
 if(n<size)toast(`작품 수에 맞춰 ${n}강으로 진행해요.`);
 wc={round:shuffle(pool).slice(0,n),next:[],idx:0};renderWc();
}
function wcPick(i){
 const w=wc.round[wc.idx+i];wc.next.push(w);wc.idx+=2;
 if(wc.idx>=wc.round.length){wc.round=wc.next;wc.next=[];wc.idx=0}
 if(wc.round.length===1){const wins=store.get(WC_KEY,[]);wins.unshift({key:keyOf(w),ts:Date.now()});store.set(WC_KEY,wins.slice(0,6));renderReport()}
 renderWc();
}

/* ---------- 작품 상세 ---------- */
let detailW=null;
const detailModal=$("#detailModal");
function openDetail(w){if(!w)return;detailW=w;addRecent(w);renderDetail();detailModal.classList.remove("hidden");document.body.classList.add("no-scroll");detailModal.querySelector(".detail-card").scrollTop=0}
function closeDetail(){detailModal.classList.add("hidden");document.body.classList.remove("no-scroll");detailW=null}
const getReviews=w=>store.get("toonPickReviews",{})[keyOf(w)]||[];
function setReviews(w,list){const all=store.get("toonPickReviews",{});all[keyOf(w)]=list;store.set("toonPickReviews",all)}
function renderDetail(){
 const w=detailW,r=ratingOf(w),reviews=getReviews(w),on=saved.has(w.id);
 const similar=webtoons.filter(x=>x!==w).map(x=>({x,n:x.genres.filter(g=>w.genres.includes(g)).length})).filter(o=>o.n>0).sort((a,b)=>b.n-a.n||a.x.title.localeCompare(b.x.title,"ko")).slice(0,6).map(o=>o.x);
 $("#detailBody").innerHTML=`<div class="detail-top"><div class="detail-cover">${coverHTML(w)}</div><div class="detail-info"><div class="eyebrow">${w.platform==="naver"?"NAVER WEBTOON":"KAKAO WEBTOON"}</div><h2>${esc(w.title)}</h2><p class="draw-meta">${esc(w.author)} · ${esc(w.status)}</p>${genreTags(w)}
 <div class="star-input" role="group" aria-label="별점 주기">${[1,2,3,4,5].map(n=>`<button data-star="${n}" class="${n<=r?"on":""}" aria-label="${n}점">★</button>`).join("")}<span>${r?`내 별점 ${r}.0 · 같은 별을 누르면 취소`:"별을 눌러 평가해 봐"}</span></div>
 <div class="detail-actions"><a class="primary-btn" href="${esc(w.link)}" target="_blank" rel="noopener noreferrer">공식 페이지에서 보기 <span>↗</span></a><button class="ghost-btn ${on?"on":""}" data-detail-save>${on?"♥ 찜 완료":"♡ 찜하기"}</button><button class="ghost-btn" data-copy>링크 복사</button><button class="ghost-btn" data-write>추천글 쓰기</button></div></div></div>
 <div class="detail-section"><h3>한줄평 <small>${reviews.length}</small></h3><form class="review-form" id="reviewForm"><input id="reviewText" maxlength="80" placeholder="이 작품을 한 줄로 표현한다면? (최대 80자)" autocomplete="off"><button class="primary-btn" type="submit">등록</button></form>
 <ul class="review-list">${reviews.length?reviews.map((v,i)=>`<li><div><b>${esc(v.name)}</b>${v.rating?`<span class="review-stars">${stars(v.rating)}</span>`:""}<time>${timeAgo(v.ts)}</time></div><p>${esc(v.text)}</p>${v.authorId===clientId?`<button class="text-btn danger" data-del-review="${i}">삭제</button>`:""}</li>`).join(""):`<li class="empty">아직 한줄평이 없어요. 첫 번째로 남겨 봐!</li>`}</ul></div>
 ${similar.length?`<div class="detail-section"><h3>비슷한 장르의 작품</h3><div class="similar-row">${similar.map(x=>`<button class="similar-item" data-detail-key="${esc(keyOf(x))}">${coverHTML(x)}<span>${esc(x.title)}</span></button>`).join("")}</div></div>`:""}`;
}
detailModal.addEventListener("click",e=>{
 if(e.target===detailModal||e.target.closest("[data-close-detail]")){closeDetail();return}
 const w=detailW;if(!w)return;
 const star=e.target.closest("[data-star]");
 if(star){setRating(w,Number(star.dataset.star));renderDetail();render();return}
 const save=e.target.closest("[data-detail-save]");
 if(save){const on=toggleSave(w.id);save.textContent=on?"♥ 찜 완료":"♡ 찜하기";save.classList.toggle("on",on);toast(on?"찜 목록에 담았어요.":"찜 목록에서 뺐어요.");return}
 if(e.target.closest("[data-copy]")){navigator.clipboard?.writeText(w.link).then(()=>toast("링크를 복사했어요."),()=>toast("복사에 실패했어요: "+w.link))??toast(w.link);return}
 if(e.target.closest("[data-write]")){
  const title=w.title;closeDetail();
  $("#postCat").value="추천";$("#postTitle").value=`「${title}」 추천해요`;$("#postToon").value=title;
  $("#community").scrollIntoView({behavior:"smooth"});setTimeout(()=>$("#postBody").focus({preventScroll:true}),400);return;
 }
 const del=e.target.closest("[data-del-review]");
 if(del){const list=getReviews(w);list.splice(Number(del.dataset.delReview),1);setReviews(w,list);renderDetail()}
});
detailModal.addEventListener("submit",e=>{
 if(e.target.id!=="reviewForm")return;e.preventDefault();
 const text=$("#reviewText").value.trim();if(text.length<2){toast("한줄평은 2자 이상 써 줘.");return}
 const list=getReviews(detailW);list.unshift({name:displayName(),text,rating:ratingOf(detailW),ts:Date.now(),authorId:clientId});
 setReviews(detailW,list);renderDetail();renderReport();toast("한줄평을 남겼어요.");
});

/* ---------- 커뮤니티 게시판 ---------- */
const POSTS_KEY="toonPickPosts",CATS=["추천","질문","후기","잡담"],PER_PAGE=5;
function seedPosts(){
 const h=3600e3,now=Date.now(),likes=n=>Array.from({length:n},(_,i)=>"seed"+i);
 return [
  {id:"p1",cat:"추천",title:"무협 입문작으로 화산귀환 강력 추천합니다",body:"초반 몇 화만 넘기면 멈출 수가 없어요.\n그림도 시원시원하고 개그 타이밍이 정말 좋아요.",toon:"화산귀환",author:"무협덕후",authorId:"seed",ts:now-h*3,likedBy:likes(14),comments:[{author:"매화바라기",text:"저도 이걸로 무협 입문했어요 ㅋㅋ",ts:now-h*2,authorId:"seed"}]},
  {id:"p2",cat:"질문",title:"로맨스판타지 처음 보려는데 뭐부터 볼까요?",body:"너무 무겁지 않고 그림 예쁜 작품 위주로 추천 부탁드려요!",toon:"",author:"로판입문",authorId:"seed",ts:now-h*20,likedBy:likes(5),comments:[{author:"툰픽러버",text:"오늘의 추첨 장르를 로맨스로 바꿔서 몇 번 돌려보세요!",ts:now-h*18,authorId:"seed"}]},
  {id:"p3",cat:"후기",title:"나 혼자만 레벨업 완결까지 정주행 후기",body:"주말 이틀 동안 끝까지 달렸습니다. 액션 연출은 지금 봐도 최고 수준이에요.",toon:"나 혼자만 레벨업",author:"정주행러",authorId:"seed",ts:now-h*50,likedBy:likes(22),comments:[]},
  {id:"p4",cat:"잡담",title:"다들 웹툰은 출퇴근길에 보세요, 자기 전에 보세요?",body:"저는 자기 전에 보다가 매번 새벽 2시가 되네요…",toon:"",author:"올빼미",authorId:"seed",ts:now-h*80,likedBy:likes(3),comments:[]}
 ];
}
let posts=store.get(POSTS_KEY,null);
if(!Array.isArray(posts)){posts=seedPosts();store.set(POSTS_KEY,posts)}
const savePosts=()=>store.set(POSTS_KEY,posts);
const board={cat:"all",q:"",sort:"new",page:1,open:null};
function postHTML(p){
 const open=board.open===p.id,liked=p.likedBy.includes(clientId),mine=p.authorId===clientId,toon=p.toon&&webtoons.find(w=>w.title===p.toon);
 return `<li class="post ${open?"open":""}"><button class="post-head" data-open="${esc(p.id)}" aria-expanded="${open}"><span class="cat-badge cat-${CATS.indexOf(p.cat)}">${esc(p.cat)}</span><span class="post-title">${esc(p.title)}</span><span class="post-meta"><span>${esc(p.author)}</span><span>${timeAgo(p.ts)}</span><span>♥ ${p.likedBy.length}</span><span>💬 ${p.comments.length}</span></span></button>
 ${open?`<div class="post-body"><p>${esc(p.body).replace(/\n/g,"<br>")}</p>${toon?`<button class="toon-chip" data-detail-key="${esc(keyOf(toon))}">📖 ${esc(toon.title)} 작품 정보</button>`:p.toon?`<span class="toon-chip muted-chip">📖 ${esc(p.toon)}</span>`:""}
 <div class="post-actions"><button class="like-btn ${liked?"on":""}" data-like="${esc(p.id)}">${liked?"♥":"♡"} 공감 ${p.likedBy.length}</button>${mine?`<button class="text-btn danger" data-del-post="${esc(p.id)}">글 삭제</button>`:""}</div>
 <ul class="comments">${p.comments.map((c,i)=>`<li><b>${esc(c.author)}</b><span>${esc(c.text)}</span><time>${timeAgo(c.ts)}</time>${c.authorId===clientId?`<button class="text-btn danger" data-del-comment="${esc(p.id)}" data-idx="${i}">삭제</button>`:""}</li>`).join("")}</ul>
 <form class="comment-form" data-comment="${esc(p.id)}"><input name="text" maxlength="200" placeholder="${esc(displayName())}(으)로 댓글 달기" autocomplete="off"><button class="primary-btn" type="submit">등록</button></form></div>`:""}</li>`;
}
function renderBoard(){
 const q=board.q.trim().toLowerCase();
 const list=posts.filter(p=>(board.cat==="all"||p.cat===board.cat)&&(!q||(p.title+" "+p.body+" "+p.author+" "+(p.toon||"")).toLowerCase().includes(q)));
 const sorters={new:(a,b)=>b.ts-a.ts,hot:(a,b)=>b.likedBy.length-a.likedBy.length||b.ts-a.ts,comments:(a,b)=>b.comments.length-a.comments.length||b.ts-a.ts};
 list.sort(sorters[board.sort]);
 const pages=Math.max(1,Math.ceil(list.length/PER_PAGE));board.page=Math.min(board.page,pages);
 const view=list.slice((board.page-1)*PER_PAGE,board.page*PER_PAGE);
 $("#boardTabs").innerHTML=["all",...CATS].map(c=>`<button class="${board.cat===c?"active":""}" data-cat="${c}">${c==="all"?"전체":c}<small>${c==="all"?posts.length:posts.filter(p=>p.cat===c).length}</small></button>`).join("");
 $("#postList").innerHTML=view.length?view.map(postHTML).join(""):`<li class="post-empty">조건에 맞는 게시글이 없어요.</li>`;
 $("#boardPager").innerHTML=pages>1?Array.from({length:pages},(_,i)=>`<button class="${i+1===board.page?"active":""}" data-page="${i+1}">${i+1}</button>`).join(""):"";
 $("#postAuthor").textContent=displayName();
 $("#postTotal").textContent=posts.length;
}
$("#boardTabs").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;board.cat=b.dataset.cat;board.page=1;renderBoard()});
$("#boardSearch").addEventListener("input",e=>{board.q=e.target.value;board.page=1;renderBoard()});
$("#boardSort").addEventListener("change",e=>{board.sort=e.target.value;renderBoard()});
$("#boardPager").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(!b)return;board.page=Number(b.dataset.page);renderBoard();$("#postList").scrollIntoView({behavior:"smooth",block:"nearest"})});
$("#postList").addEventListener("click",e=>{
 const head=e.target.closest("[data-open]");
 if(head){board.open=board.open===head.dataset.open?null:head.dataset.open;renderBoard();return}
 const like=e.target.closest("[data-like]");
 if(like){const p=posts.find(x=>x.id===like.dataset.like),i=p.likedBy.indexOf(clientId);i<0?p.likedBy.push(clientId):p.likedBy.splice(i,1);savePosts();renderBoard();return}
 const delPost=e.target.closest("[data-del-post]");
 if(delPost){if(!confirm("이 게시글을 삭제할까요?"))return;posts=posts.filter(x=>x.id!==delPost.dataset.delPost);savePosts();board.open=null;renderBoard();renderReport();toast("게시글을 삭제했어요.");return}
 const delC=e.target.closest("[data-del-comment]");
 if(delC){const p=posts.find(x=>x.id===delC.dataset.delComment);p.comments.splice(Number(delC.dataset.idx),1);savePosts();renderBoard()}
});
$("#postList").addEventListener("submit",e=>{
 const form=e.target.closest("[data-comment]");if(!form)return;e.preventDefault();
 const text=form.elements.text.value.trim();if(!text){toast("댓글 내용을 입력해 줘.");return}
 posts.find(x=>x.id===form.dataset.comment).comments.push({author:displayName(),text,ts:Date.now(),authorId:clientId});
 savePosts();renderBoard();
});
const postBody=$("#postBody");
postBody.addEventListener("input",()=>{$("#postCount").textContent=`${postBody.value.length} / 1000`});
$("#postForm").addEventListener("submit",e=>{
 e.preventDefault();
 const msg=$("#postMsg"),title=$("#postTitle").value.trim(),body=postBody.value.trim(),toon=$("#postToon").value.trim();
 msg.className="form-message";
 if(title.length<2){msg.textContent="제목은 2자 이상 입력해 줘.";return}
 if(body.length<5){msg.textContent="내용은 5자 이상 입력해 줘.";return}
 const p={id:"p"+Date.now().toString(36),cat:$("#postCat").value,title,body,toon,author:displayName(),authorId:clientId,ts:Date.now(),likedBy:[],comments:[]};
 posts.unshift(p);savePosts();
 Object.assign(board,{cat:"all",q:"",sort:"new",page:1,open:p.id});$("#boardSearch").value="";$("#boardSort").value="new";
 e.target.reset();$("#postCount").textContent="0 / 1000";msg.textContent="";
 renderBoard();renderReport();toast("게시글을 등록했어요!");
});

/* ---------- 취향 리포트 ---------- */
function renderReport(){
 const ratings=getRatings(),rated=Object.keys(ratings),savedList=webtoons.filter(w=>saved.has(w.id)),wins=store.get(WC_KEY,[]),recent=store.get("toonPickRecent",[]).map(byKey).filter(Boolean);
 const avg=rated.length?(rated.reduce((s,k)=>s+ratings[k],0)/rated.length).toFixed(1):"-";
 const reviewCount=Object.values(store.get("toonPickReviews",{})).flat().filter(v=>v.authorId===clientId).length;
 const tiles=[["찜한 작품",savedList.length,"♡"],["별점 평가",rated.length,"★"],["평균 별점",avg,"✦"],["월드컵 우승",wins.length,"🏆"],["내 한줄평",reviewCount,"✎"],["내 게시글",posts.filter(p=>p.authorId===clientId).length,"☰"]];
 $("#reportTiles").innerHTML=tiles.map(([label,v,icon])=>`<div class="report-tile"><span>${label}<i>${icon}</i></span><strong>${v}</strong></div>`).join("");
 // 찜 +2, 별점 3점 이상은 (점수-2), 월드컵 우승 +1 가중치로 장르 점수를 계산한다.
 const score={};const add=(w,n)=>w&&w.genres.forEach(g=>score[g]=(score[g]||0)+n);
 savedList.forEach(w=>add(w,2));rated.forEach(k=>{if(ratings[k]>=3)add(byKey(k),ratings[k]-2)});wins.forEach(x=>add(byKey(x.key),1));
 const rows=GENRES.map(g=>[g,score[g]||0]).sort((a,b)=>b[1]-a[1]),max=rows[0][1];
 $("#genreBars").innerHTML=rows.map(([g,v],i)=>`<div class="bar-row ${i===0&&max?"top":""}"><span>${g}</span><div class="bar"><i style="width:${max?v/max*100:0}%"></i></div><b>${v}</b></div>`).join("");
 $("#tasteSummary").innerHTML=max?`당신은 <b>${rows[0][0]}</b> 러버! <button data-goto-genre="${rows[0][0]}">${rows[0][0]} 작품 더 보기 →</button>`:"아직 데이터가 부족해요. 작품을 찜하거나 별점을 남기면 취향을 분석해 줄게!";
 $("#recentRow").innerHTML=recent.length?recent.map(w=>`<button class="recent-item" data-detail-key="${esc(keyOf(w))}">${coverHTML(w)}<span>${esc(w.title)}</span></button>`).join(""):`<p class="recent-empty">작품 제목이나 표지를 누르면 여기에 기록돼요.</p>`;
}
$("#clearRecent").addEventListener("click",()=>{store.set("toonPickRecent",[]);renderReport()});

/* ---------- 공통 이벤트 ---------- */
document.addEventListener("click",e=>{
 const k=e.target.closest("[data-detail-key]");
 if(k){openDetail(byKey(k.dataset.detailKey));return}
 const g=e.target.closest("[data-goto-genre]");
 if(g){document.querySelector(`.genre-chip[data-genre="${g.dataset.gotoGenre}"]`)?.click();$("#discover").scrollIntoView({behavior:"smooth"});return}
 if(e.target.closest("[data-recent]"))addRecent(drawCurrent);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&detailW)closeDetail()});
$("#drawAgain").addEventListener("click",reroll);
$("#drawSave").addEventListener("click",()=>{const on=toggleSave(drawCurrent.id);toast(on?"찜 목록에 담았어요.":"찜 목록에서 뺐어요.")});
$("#drawDetail").addEventListener("click",()=>openDetail(drawCurrent));
$("#drawGenre").innerHTML+=GENRES.map(g=>`<option>${g}</option>`).join("");
$("#wcBox").addEventListener("click",e=>{
 if(e.target.closest("#wcStart")){wcStart();return}
 if(e.target.closest("#wcReset")||e.target.closest("#wcQuit")){wc=null;renderWc();return}
 const pick=e.target.closest("[data-pick]");
 if(pick&&!wcBusy){
  wcBusy=true;pick.classList.add("chosen");$("#wcBox").querySelectorAll("[data-pick]").forEach(b=>b!==pick&&b.classList.add("lost"));
  setTimeout(()=>{wcBusy=false;wcPick(Number(pick.dataset.pick))},300);return;
 }
 const save=e.target.closest("[data-wc-save]");
 if(save){toggleSave(wc.round[0].id);renderWc()}
});
// 스크롤 위치에 맞춰 상단 메뉴 강조 + 맨 위로 버튼
const navLinks=[...document.querySelectorAll(".topbar nav a")];
const navObserver=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting)navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+en.target.id))}),{rootMargin:"-45% 0px -50% 0px"});
navLinks.forEach(a=>{const s=document.querySelector(a.getAttribute("href"));if(s)navObserver.observe(s)});
const toTop=$("#toTop");
addEventListener("scroll",()=>toTop.classList.toggle("show",scrollY>700),{passive:true});
toTop.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

// app.js의 render()가 끝날 때마다 호출된다(찜 변경, API 데이터 교체 등).
let lastList=null;
function onToonChange(){
 if(lastList!==webtoons){
  lastList=webtoons;
  $("#toonTitles").innerHTML=webtoons.map(w=>`<option value="${esc(w.title)}">`).join("");
  if(drawCurrent&&!webtoons.includes(drawCurrent))initDraw();
  if(wc){wc=null;renderWc()}
 }
 if(drawCurrent)updateDrawSave();
 renderReport();
}

renderUser();initDraw();renderWc();renderBoard();render();
