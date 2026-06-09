const homeCategories = [
  {
    title: "Design",
    description: "UI/UX, Visual, and Motion",
    icon: "brush"
  },
  {
    title: "Engineering",
    description: "Frontend, Backend, and AI",
    icon: "code"
  },
  {
    title: "Product",
    description: "Management and Strategy",
    icon: "inventory_2"
  },
  {
    title: "Marketing",
    description: "Growth, Content, and SEO",
    icon: "campaign"
  }
];

const premierRoles = [
  {
    title: "Lead Product Designer",
    company: "Linear",
    location: "Remote",
    salary: "$160k - $220k",
    icon: "token",
    tags: ["Design", "Senior"]
  },
  {
    title: "Staff Frontend Engineer",
    company: "Vercel",
    location: "San Francisco",
    salary: "$180k - $250k",
    icon: "grid_view",
    tags: ["Engineering", "Staff"]
  },
  {
    title: "Head of Growth",
    company: "Notion",
    location: "New York",
    salary: "$150k - $210k",
    icon: "category",
    tags: ["Marketing", "Executive"]
  }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCategories() {
  const categoryGrid = document.getElementById("categoryGrid");
  if (!categoryGrid) return;

  categoryGrid.innerHTML = homeCategories.map((category) => `
    <a class="category-card" href="/jobs.html?category=${encodeURIComponent(category.title)}">
      <div class="category-icon">
        <span class="material-symbols-outlined">${escapeHtml(category.icon)}</span>
      </div>
      <h3>${escapeHtml(category.title)}</h3>
      <p>${escapeHtml(category.description)}</p>
    </a>
  `).join("");
}

function renderRoles() {
  const rolesList = document.getElementById("rolesList");
  if (!rolesList) return;

  rolesList.innerHTML = premierRoles.map((role) => {
    const tags = role.tags.map((tag) => `
      <span class="role-tag">${escapeHtml(tag)}</span>
    `).join("");

    return `
      <article class="role-card">
        <div class="role-main">
          <div class="role-icon">
            <span class="material-symbols-outlined">${escapeHtml(role.icon)}</span>
          </div>
          <div>
            <h3>${escapeHtml(role.title)}</h3>
            <p>${escapeHtml(role.company)} &bull; ${escapeHtml(role.location)} &bull; ${escapeHtml(role.salary)}</p>
          </div>
        </div>
        <div class="role-actions">
          <div class="role-tags">${tags}</div>
          <button class="save-role" type="button" aria-label="Save ${escapeHtml(role.title)}">
            <span class="material-symbols-outlined">bookmark</span>
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function bindHeroSearch() {
  const form = document.getElementById("heroSearchForm");
  const input = document.getElementById("heroSearchInput");
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const url = query ? `/jobs.html?search=${encodeURIComponent(query)}` : "/jobs.html";
    window.location.href = url;
  });
}

function bindSaveButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".save-role");
    if (!button) return;

    button.classList.toggle("is-saved");
    const icon = button.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = button.classList.contains("is-saved") ? "bookmark_added" : "bookmark";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderRoles();
  bindHeroSearch();
  bindSaveButtons();
});
