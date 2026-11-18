const app = document.getElementById("app");

app.innerHTML = `
  <header class="header">
    <h1>INDEGRAM</h1>
    <p>Connect. Share. Belong.</p>
  </header>

  <main class="welcome">
    <h2>Welcome to INDEGRAM</h2>
    <p>India's photo sharing community.</p>

    <div class="auth-box">
      <h3>Join the community</h3>

      <input type="email" id="email" placeholder="Email address">

      <input type="password" id="password" placeholder="Password">

      <button id="loginBtn">Log In</button>
      <button id="signupBtn">Create Account</button>
    </div>
  </main>
`;

document.getElementById("loginBtn").addEventListener("click", () => {
  alert("Login system will be connected to Supabase soon!");
});

document.getElementById("signupBtn").addEventListener("click", () => {
  alert("Signup system will be connected to Supabase soon!");
});
