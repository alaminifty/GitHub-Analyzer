// ✅ FINAL script.js
const input = document.getElementById("usernameInput");
const btn = document.getElementById("searchBtn");
const statusPill = document.getElementById("statusPill");
const result = document.getElementById("result");

function setStatus(type, text) {
  statusPill.className = `statusPill ${type}`;
  statusPill.textContent = text;
}

function setLoading(isLoading) {
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
  input.disabled = isLoading;
}

function renderSkeleton() {
  result.innerHTML = `
    <div class="skWrap">
      <div class="skeleton skProfile"></div>
      <div class="skeleton skRepos"></div>
    </div>
  `;
}

async function fetchGitHubUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "User not found");
  return data;
}

async function fetchUserRepos(username) {
  const res = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=5`);
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch repositories");
  return data;
}

function compactNumber(n) {
  try {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
  } catch {
    return n;
  }
}

function safeText(s, fallback = "—") {
  if (s === null || s === undefined) return fallback;
  const t = String(s).trim();
  return t.length ? t : fallback;
}

function normalizeUrl(url) {
  if (!url) return "";
  const u = url.trim();
  if (!u) return "";
  return u.startsWith("http") ? u : `https://${u}`;
}

function repoCard(repo) {
  const lang = repo.language ? `<span class="chip">🧠 ${repo.language}</span>` : "";
  const desc = repo.description ? `<div class="repoMeta">${repo.description}</div>` : "";
  return `
    <li class="repo">
      <div class="repoTop">
        <a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a>
        <span class="chip">⭐ ${repo.stargazers_count}</span>
      </div>
      ${desc}
      <div class="repoMeta" style="margin-top:8px;">
        ${lang}
        <span class="chip">🍴 ${repo.forks_count}</span>
        <span class="chip">👀 ${repo.watchers_count}</span>
      </div>
    </li>
  `;
}

function render(user, repos) {
  const profileLink = user.html_url || `https://github.com/${user.login}`;

  const topReposHtml = repos.length
    ? repos.map(repoCard).join("")
    : `<div class="hint">No public repositories found.</div>`;

  const blogUrl = normalizeUrl(user.blog);

  result.innerHTML = `
    <div class="grid">
      <div class="profileCard">
        <img class="avatar" src="${user.avatar_url}" alt="avatar" />
        <div style="position:relative; min-width:0;">
          <div class="nameRow">
            <h2>${safeText(user.name, user.login)}</h2>
            <span class="badge">👤 @${user.login}</span>
            ${user.location ? `<span class="badge">📍 ${safeText(user.location)}</span>` : ``}
          </div>

          <p class="bio">${safeText(user.bio, "No bio available yet.")}</p>

          <div class="repoMeta" style="margin-bottom:10px;">
            ${user.company ? `<span class="chip">🏢 ${safeText(user.company)}</span>` : ``}
            ${blogUrl ? `<a class="chip" href="${blogUrl}" target="_blank" rel="noreferrer">🔗 Website</a>` : ``}
            <a class="chip" href="${profileLink}" target="_blank" rel="noreferrer">↗ View GitHub</a>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="k">Followers</div>
              <div class="v">${compactNumber(user.followers)}</div>
            </div>
            <div class="stat">
              <div class="k">Following</div>
              <div class="v">${compactNumber(user.following)}</div>
            </div>
            <div class="stat">
              <div class="k">Public Repos</div>
              <div class="v">${compactNumber(user.public_repos)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="reposCard">
        <div class="reposHead">
          <h3>🔥 Top Repositories</h3>
          <span class="badge">Sorted by ⭐</span>
        </div>
        <ul class="repos">${topReposHtml}</ul>
      </div>
    </div>
  `;
}

async function analyze() {
  const username = input.value.trim();

  if (!username) {
    setStatus("warn", "Please enter a GitHub username");
    result.innerHTML = "";
    return;
  }

  setLoading(true);
  setStatus("warn", "🔍 Analyzing profile...");
  renderSkeleton();

  try {
    const [user, repos] = await Promise.all([
      fetchGitHubUser(username),
      fetchUserRepos(username),
    ]);

    setStatus("ok", "Profile loaded ✅");
    render(user, repos);
  } catch (err) {
    setStatus("err", "Error ❌");
    result.innerHTML = `
      <div class="reposCard">
        <p style="margin:0;color:rgba(255,215,215,0.95)">${err.message}</p>
      </div>
    `;
  } finally {
    setLoading(false);
  }
}

btn.addEventListener("click", analyze);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") analyze();
});
