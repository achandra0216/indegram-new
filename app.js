const SUPABASE_URL = "https://hlocmgnnzyqcyuthjgnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_c3l4Wzy9B6Obz8daXE4uRQ_GSNDx4HL";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const app = document.getElementById("app");

let currentUser = null;
let posts = [];

async function startApp() {
  const { data } = await db.auth.getSession();
  currentUser = data.session?.user || null;

  if (!currentUser) {
    showAuth();
  } else {
    await showHome();
  }
}

function showAuth() {
  app.innerHTML = `
    <header class="header">
      <h1>INDEGRAM</h1>
      <p>Connect. Share. Belong.</p>
    </header>

    <main class="welcome">
      <h2>Welcome to INDEGRAM</h2>
      <p>India's photo sharing community.</p>

      <div class="auth-box">
        <input id="email" type="email" placeholder="Email address">
        <input id="password" type="password" placeholder="Password">
        <button id="signup">Create Account</button>
        <button id="login">Log In</button>
      </div>
    </main>
  `;

  document.getElementById("signup").onclick = () => authenticate("signup");
  document.getElementById("login").onclick = () => authenticate("login");
}

async function authenticate(type) {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password.");
    return;
  }

  const result = type === "signup"
    ? await db.auth.signUp({ email, password })
    : await db.auth.signInWithPassword({ email, password });

  if (result.error) {
    alert(result.error.message);
    return;
  }

  if (type === "signup" && !result.data.session) {
    alert("Please verify your email, then log in.");
    return;
  }

  currentUser = result.data.user;
  await showHome();
}

async function showHome() {
  app.innerHTML = `
    <header class="header">
      <h1>INDEGRAM</h1>
      <p>Connect. Share. Belong.</p>
    </header>

    <section class="auth-box">
      <h3>Create a Photo Post</h3>
      <input type="file" id="photo" accept="image/*">
      <input id="caption" placeholder="Write a caption...">
      <button id="upload">Share Post</button>
    </section>

    <section class="welcome">
      <h2>Home Feed</h2>
      <div id="feed">Loading posts...</div>
    </section>

    <button id="logout">Log Out</button>
  `;

  document.getElementById("upload").onclick = uploadPost;
  document.getElementById("logout").onclick = logout;

  await loadPosts();
}

async function uploadPost() {
  const file = document.getElementById("photo").files[0];
  const caption = document.getElementById("caption").value;

  if (!file) {
    alert("Please select a photo.");
    return;
  }

  const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await db.storage
    .from("post-images")
    .upload(filePath, file);

  if (uploadError) {
    alert(uploadError.message);
    return;
  }

  const { data: imageData } = db.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { error } = await db.from("posts").insert({
    user_id: currentUser.id,
    image_url: imageData.publicUrl,
    caption: caption
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Your photo has been posted!");
  await loadPosts();
}

async function loadPosts() {
  const { data, error } = await db
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const feed = document.getElementById("feed");

  if (error) {
    feed.textContent = error.message;
    return;
  }

  posts = data || [];

  feed.innerHTML = posts.map(post => `
    <article class="auth-box">
      <img src="${post.image_url}"
        style="width:100%;border-radius:12px;">

      <p>${escapeHTML(post.caption || "")}</p>

      <button onclick="likePost('${post.id}')">❤️ Like</button>
      <button onclick="commentPost('${post.id}')">💬 Comment</button>
      <button onclick="followUser('${post.user_id}')">＋ Follow</button>
    </article>
  `).join("") || "<p>No posts yet. Be the first!</p>";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function likePost(postId) {
  const { data: existingLike, error: checkError } = await db
    .from("likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (checkError) {
    alert(checkError.message);
    return;
  }

  if (existingLike) {
    const { error } = await db
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", currentUser.id);

    if (error) alert(error.message);
    else alert("Unliked!");
  } else {
    const { error } = await db
      .from("likes")
      .insert({
        post_id: postId,
        user_id: currentUser.id
      });

    if (error) alert(error.message);
    else alert("Liked!");
  }
}

async function commentPost(postId) {
  const content = prompt("Write your comment:");

  if (!content) return;

  const { error } = await db.from("comments").insert({
    post_id: postId,
    user_id: currentUser.id,
    content: content
  });

  if (error) alert(error.message);
  else alert("Comment added!");
}

async function followUser(userId) {
  if (userId === currentUser.id) {
    alert("You cannot follow yourself.");
    return;
  }

  const { error } = await db.from("follows").insert({
    follower_id: currentUser.id,
    following_id: userId
  });

  if (error) alert(error.message);
  else alert("Follow request saved!");
}

async function logout() {
  await db.auth.signOut();
  currentUser = null;
  showAuth();
}

startApp();
