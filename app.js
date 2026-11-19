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
<section class="auth-box" id="profileSection">
  <h2>My Profile</h2>

  <div style="text-align:center;">
    <img id="profileAvatar"
      src="https://placehold.co/120x120?text=Profile"
      style="width:120px;height:120px;border-radius:50%;object-fit:cover;">

    <h3 id="profileName">Your Name</h3>
    <p id="profileUsername">@username</p>
    <p id="profileBio">Welcome to my INDEGRAM profile!</p>
  </div>

  <input type="file" id="avatarInput" accept="image/*">
  <input type="text" id="fullName" placeholder="Full Name">
  <input type="text" id="username" placeholder="Username">
  <textarea id="bio" placeholder="Write your bio"></textarea>

  <div style="display:flex;justify-content:space-around;padding:15px;">
    <span><b id="postCount">0</b> Posts</span>
    <span><b id="followerCount">0</b> Followers</span>
    <span><b id="followingCount">0</b> Following</span>
  </div>

  <button id="saveProfile">Save Profile</button>

  <h3>My Posts</h3>
  <div id="myPostGrid"></div>
</section>
    <button id="logout">Log Out</button>
  `;

  document.getElementById("upload").onclick = uploadPost;
  document.getElementById("logout").onclick = logout;
document.getElementById("saveProfile").onclick = saveProfile;
  await loadPosts();
}
async function loadProfile() {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.log(error.message);
    return;
  }

  document.getElementById("profileName").textContent =
    data.full_name || "Your Name";

  document.getElementById("profileUsername").textContent =
    "@" + (data.username || "username");

  document.getElementById("profileBio").textContent =
    data.bio || "Welcome to INDEGRAM";

  if (data.avatar_url) {
    document.getElementById("profileAvatar").src = data.avatar_url;
  }

  document.getElementById("fullName").value = data.full_name || "";
  document.getElementById("username").value = data.username || "";
  document.getElementById("bio").value = data.bio || "";
}

async function saveProfile() {
  alert("Save button is working!");
  const fullName = document.getElementById("fullName").value.trim();
  const username = document.getElementById("username").value.trim();
  const bio = document.getElementById("bio").value.trim();

  const { error } = await db
    .from("profiles")
    .update({
      full_name: fullName,
      username: username,
      bio: bio
    })
    .eq("id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Profile updated successfully!");
  await loadProfile();
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
