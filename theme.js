// theme.js — 다크 모드. <head>에서 먼저 실행해 페이지가 깜빡이지 않게 하고, 푸터의 토글 버튼과 연결한다.
(function(){
 const KEY="toonPickTheme";
 function stored(){try{return localStorage.getItem(KEY)}catch(e){return null}}
 function preferred(){return stored()||(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}
 function apply(theme){
  document.documentElement.dataset.theme=theme;
  document.querySelectorAll("[data-theme-toggle]").forEach(b=>{
   b.setAttribute("aria-pressed",String(theme==="dark"));
   const label=b.querySelector(".theme-label"),icon=b.querySelector(".theme-thumb");
   if(label)label.textContent=theme==="dark"?"다크 모드 켜짐":"다크 모드";
   if(icon)icon.textContent=theme==="dark"?"☾":"☀";
  });
 }
 apply(preferred());
 document.addEventListener("DOMContentLoaded",()=>{
  apply(document.documentElement.dataset.theme);
  document.querySelectorAll("[data-theme-toggle]").forEach(b=>b.addEventListener("click",()=>{
   const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
   try{localStorage.setItem(KEY,next)}catch(e){}
   apply(next);
  }));
 });
 // 사용자가 직접 고르지 않았다면 OS 설정 변경을 따라간다.
 if(window.matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",e=>{if(!stored())apply(e.matches?"dark":"light")});
})();
