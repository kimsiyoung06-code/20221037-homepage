const form=document.getElementById("signupForm"),message=document.getElementById("formMessage");
form.addEventListener("submit",e=>{
 e.preventDefault();message.className="form-message";message.textContent="";
 const nickname=document.getElementById("nickname").value.trim();
 const email=document.getElementById("email").value.trim().toLowerCase();
 const password=document.getElementById("password").value;
 const confirm=document.getElementById("passwordConfirm").value;
 if(password.length<8){message.textContent="비밀번호는 8자 이상 입력해 주세요.";return;}
 if(password!==confirm){message.textContent="비밀번호가 서로 달라요. 다시 확인해 주세요.";return;}
 if(!document.getElementById("terms").checked){message.textContent="동의 항목을 체크해 주세요.";return;}
 const users=JSON.parse(localStorage.getItem("toonPickDemoUsers")||"[]");
 if(users.some(u=>u.email===email)){message.textContent="이미 이 브라우저에 등록된 이메일이에요.";return;}
 // Demonstration only. Never store plaintext passwords in a real service.
 users.push({nickname,email,createdAt:new Date().toISOString()});
 localStorage.setItem("toonPickDemoUsers",JSON.stringify(users));
 localStorage.setItem("toonPickCurrentUser",JSON.stringify({nickname,email}));
 message.className="form-message success";
 message.textContent=`${nickname}님, 데모 계정이 만들어졌어요! 메인 페이지로 이동합니다.`;
 form.reset();
 setTimeout(()=>location.href="index.html",1300);
});