const STORE="toonPickBoardPostsV1";
const starter=[
{id:1,category:"작품 추천",nickname:"웹툰탐험가",title:"정주행하기 좋은 작품 추천해주세요!",content:"요즘 몰입감 있는 액션이나 판타지 작품을 찾고 있어요. 다들 재미있게 본 작품이 있나요?",date:"2026.10.25",likes:3},
{id:2,category:"자유 이야기",nickname:"밤샘독자",title:"한 화만 보려고 했는데 새벽이 됐어요",content:"분명 한 편만 보려고 했는데 어느새 최신화까지 다 읽어버렸네요 😂 여러분의 정주행 기록도 궁금해요.",date:"2026.10.24",likes:5},
{id:3,category:"감상·후기",nickname:"핑크빛페이지",title:"로맨스 웹툰 볼 때 설레는 순간",content:"주인공들이 서로 마음을 깨닫기 직전의 분위기가 제일 좋아요. 여러분은 어떤 장면을 좋아하나요?",date:"2026.10.23",likes:2}
];
let posts=JSON.parse(localStorage.getItem(STORE)||"null")||starter;
let category="전체";
const list=document.getElementById("boardList"), empty=document.getElementById("boardEmpty");
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function persist(){localStorage.setItem(STORE,JSON.stringify(posts));}
function render(){
 const q=document.getElementById("boardSearch").value.trim().toLowerCase();
 const shown=posts.filter(p=>(category==="전체"||p.category===category)&&(`${p.title} ${p.content} ${p.nickname} ${p.category}`).toLowerCase().includes(q)).sort((a,b)=>b.id-a.id);
 list.innerHTML=shown.map(p=>`<article class="board-post"><div><span class="post-category">${safe(p.category)}</span><h3>${safe(p.title)}</h3><p>${safe(p.content)}</p><div class="post-meta"><span>✦ ${safe(p.nickname)}</span><span>${safe(p.date)}</span><span>♡ 좋아요 ${p.likes||0}</span></div></div><div class="post-actions"><button data-like="${p.id}" aria-label="좋아요">♡</button><button data-delete="${p.id}" aria-label="삭제">삭제</button></div></article>`).join("");
 empty.hidden=shown.length>0;list.hidden=shown.length===0;
}
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{category=b.dataset.category;document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x===b));render();}));
document.getElementById("boardSearch").addEventListener("input",render);
document.getElementById("boardForm").addEventListener("submit",e=>{
 e.preventDefault();
 const nickname=document.getElementById("postNickname").value.trim(),title=document.getElementById("postTitle").value.trim(),content=document.getElementById("postContent").value.trim();
 if(!nickname||!title||!content)return;
 posts.push({id:Date.now(),category:document.getElementById("postCategory").value,nickname,title,content,date:new Date().toLocaleDateString("ko-KR"),likes:0});
 persist();e.target.reset();category="전체";document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x.dataset.category==="전체"));
 document.getElementById("boardMessage").textContent="게시글을 등록했어요.";render();window.scrollTo({top:300,behavior:"smooth"});
});
list.addEventListener("click",e=>{
 const like=e.target.closest("[data-like]"),del=e.target.closest("[data-delete]");
 if(like){const p=posts.find(x=>x.id===Number(like.dataset.like));if(p)p.likes=(p.likes||0)+1;persist();render();}
 if(del){const p=posts.find(x=>x.id===Number(del.dataset.delete));if(p&&confirm("이 게시글을 삭제할까요?")){posts=posts.filter(x=>x.id!==p.id);persist();render();}}
});
render();
