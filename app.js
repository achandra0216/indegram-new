const SUPABASE_URL = "https://hlocmgnnzyqcyuthjgnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_c3l4Wzy9B6Obz8daXE4uRQ_GSNDx4HL";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
      <h3 id="formTitle">Join the community</h3>

      <form id="authForm">
        <input
          type="email"
          id="email"
          placeholder="Email address"
          required
        >

        <input
          type="password"
          id="password"
          placeholder="Password"
          required
        >

        <button type="submit" id="submitBtn">
          Create Account
        </button>
      </form>

      <p style="text-align:center;margin-top:20px;">
        <span id="switchText">Already have an account?</span>
        <button
          type="button"
          id="switchBtn"
          style="background:none;color:#138808;padding:5px;width:auto;"
        >
          Log In
        </button>
      </p>
    </div>
  </main>

  <footer style="text-align:center;padding:25px;color:#888;font-size:13px;">
    © 2026 INDEGRAM
    <br>
    Made for India 🇮🇳
  </footer>
`;

let isLogin = false;

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switchText");

switchBtn.addEventListener("click", () => {
  isLogin = !isLogin;

  if (isLogin) {
    formTitle.textContent = "Welcome Back";
    submitBtn.textContent = "Log In";
    switchText.textContent = "New to INDEGRAM?";
    switchBtn.textContent = "Create Account";
  } else {
    formTitle.textContent = "Join the community";
    submitBtn.textContent = "Create Account";
    switchText.textContent = "Already have an account?";
    switchBtn.textContent = "Log In";
  }
});

document.getElementById("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const button = document.getElementById("submitBtn");

  button.disabled = true;
  button.textContent = "Please wait...";

  try {
    let result;

    if (isLogin) {
      result = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
    } else {
      result = await supabaseClient.auth.signUp({
        email,
        password
      });
    }

    if (result.error) {
      alert(result.error.message);
    } else if (isLogin) {
      alert("Welcome back to INDEGRAM!");
    } else {
      alert("Account created! Please verify your email.");
    }
  } catch (error) {
    alert("Something went wrong. Please try again.");
  }

  button.disabled = false;
  button.textContent = isLogin ? "Log In" : "Create Account";
});
