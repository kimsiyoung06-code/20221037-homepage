const form = document.getElementById("signupForm");
const message = document.getElementById("formMessage");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const nickname = document.getElementById("nickname").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;
  const terms = document.getElementById("terms").checked;

  message.className = "form-message";
  if (nickname.length < 2) {
    message.textContent = "닉네임은 2자 이상 입력해 주세요.";
    message.classList.add("error");
    return;
  }
  if (password.length < 8) {
    message.textContent = "비밀번호는 8자 이상 입력해 주세요.";
    message.classList.add("error");
    return;
  }
  if (password !== passwordConfirm) {
    message.textContent = "비밀번호가 서로 일치하지 않습니다.";
    message.classList.add("error");
    return;
  }
  if (!terms) {
    message.textContent = "이용 안내 동의 항목을 확인해 주세요.";
    message.classList.add("error");
    return;
  }

  // Demo only: do not store passwords. This is not server-side authentication.
  const accounts = JSON.parse(localStorage.getItem("toonPickAccounts") || "[]");
  if (accounts.some(account => account.email === email)) {
    message.textContent = "이미 등록된 이메일입니다.";
    message.classList.add("error");
    return;
  }
  accounts.push({ nickname, email, createdAt: new Date().toISOString() });
  localStorage.setItem("toonPickAccounts", JSON.stringify(accounts));
  localStorage.setItem("toonPickCurrentUser", JSON.stringify({ nickname, email }));
  message.textContent = "데모 계정이 생성되었습니다. 메인 페이지로 이동합니다.";
  message.classList.add("success");
  form.reset();
  window.setTimeout(() => { window.location.href = "index.html"; }, 900);
});
