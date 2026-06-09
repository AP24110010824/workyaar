"use strict";

(function () {
  const API_BASE = `${window.location.origin}/api/jobs`;
  const fallbackJobs = [
    {
      id: 901,
      title: "Senior Product Designer",
      company_name: "Atelier Careers",
      category_name: "Design",
      location: "Remote",
      job_type: "Full-time",
      experience_level: "5+ years",
      salary_min: 165000,
      salary_max: 210000,
      description: "Own polished product experiences across hiring workflows, dashboards, and candidate discovery."
    },
    {
      id: 902,
      title: "Frontend Engineer, React",
      company_name: "Finova Tech",
      category_name: "Engineering",
      location: "San Francisco, CA",
      job_type: "Hybrid",
      experience_level: "3-6 years",
      salary_min: 140000,
      salary_max: 190000,
      description: "Build fast, accessible interfaces for high-scale talent products."
    },
    {
      id: 903,
      title: "AI Platform Engineer",
      company_name: "Velocity AI",
      category_name: "AI / ML",
      location: "Remote",
      job_type: "Contract",
      experience_level: "4+ years",
      salary_min: 120000,
      salary_max: 175000,
      description: "Design reliable AI platform services, observability, and workflow automation."
    }
  ];

  const state = {
    allJobs: [],
    filteredJobs: [],
    page: 1,
    perPage: 5,
    saved: new Set(JSON.parse(localStorage.getItem("savedJobIds") || "[]"))
  };

  const el = (id) => document.getElementById(id);
  const text = (value, fallback = "-") => value || fallback;
  const money = (value) => value ? `$${Number(value).toLocaleString()}` : "";

  function stableMatch(job) {
    const seed = String(job.id || job.title || "job").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return 58 + (seed % 39);
  }

  function normalizeJobs(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.jobs)) return payload.jobs;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  async function fetchJobs() {
    const query = new URLSearchParams();
    const keyword = el("keyword")?.value.trim();
    const remote = el("remote")?.value;

    if (keyword) query.set("keyword", keyword);
    if (remote) query.set("remote", remote);

    try {
      const res = await fetch(`${API_BASE}?${query.toString()}`);
      if (!res.ok) throw new Error(`Jobs request failed: ${res.status}`);
      const jobs = normalizeJobs(await res.json());
      state.allJobs = jobs.length ? jobs : fallbackJobs;
    } catch (error) {
      console.warn(error);
      state.allJobs = fallbackJobs;
    }
  }

  function applyLocalFilters() {
    const keyword = el("keyword")?.value.trim().toLowerCase() || "";
    const location = el("location")?.value.trim().toLowerCase() || "";
    const type = el("type")?.value.trim().toLowerCase() || "";
    const minMatch = Number(el("matchRange")?.value || 0);

    state.filteredJobs = state.allJobs.filter((job) => {
      const haystack = [
        job.title,
        job.company_name,
        job.category_name,
        job.description,
        job.experience_level
      ].join(" ").toLowerCase();

      const place = [job.location, job.city_name, job.state_name, job.country_name].join(" ").toLowerCase();
      const jobType = String(job.job_type || "").toLowerCase();

      return (!keyword || haystack.includes(keyword)) &&
        (!location || place.includes(location)) &&
        (!type || jobType.includes(type)) &&
        stableMatch(job) >= minMatch;
    });
  }

  function renderJobs() {
    const container = el("jobsContainer");
    if (!container) return;

    const start = (state.page - 1) * state.perPage;
    const visibleJobs = state.filteredJobs.slice(start, start + state.perPage);

    el("jobCountLabel").textContent = `${state.filteredJobs.length} role${state.filteredJobs.length === 1 ? "" : "s"}`;
    el("activeFilterText").textContent = el("keyword")?.value ? "Search results" : "Top matches";

    if (!visibleJobs.length) {
      container.innerHTML = `<div class="empty-state">No jobs found. Try a different keyword, location, or match score.</div>`;
      renderPagination();
      return;
    }

    container.innerHTML = visibleJobs.map((job) => {
      const initials = text(job.company_name, "WY").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      const salary = money(job.salary_min) || money(job.salary_max)
        ? `${money(job.salary_min)}${job.salary_min && job.salary_max ? " - " : ""}${money(job.salary_max)}`
        : "Competitive";
      const tags = [job.category_name, job.job_type, job.experience_level].filter(Boolean).slice(0, 3);
      const saved = state.saved.has(Number(job.id));

      return `
        <article class="job-card">
          <div class="job-logo">${initials}</div>
          <div class="job-main">
            <h3>${text(job.title, "Untitled Role")}</h3>
            <p>${text(job.company_name, "WorkYaar Partner")}</p>
            <div class="job-meta">
              <span><i class="fa-solid fa-location-dot"></i> ${text(job.location || job.city_name || job.country_name, "Remote")}</span>
              <span><i class="fa-solid fa-money-bill-wave"></i> ${salary}</span>
            </div>
            <div class="job-tags">
              ${tags.map((tag) => `<span class="job-tag">${tag}</span>`).join("")}
            </div>
          </div>
          <div class="job-match">${stableMatch(job)}%<br><small>Match</small></div>
          <div class="job-actions">
            <a class="details-btn" href="/job-details.html?id=${encodeURIComponent(job.id)}">
              <i class="fa-regular fa-eye"></i> Details
            </a>
            <button class="save-btn ${saved ? "is-saved" : ""}" data-save-job="${job.id}" type="button">
              <i class="fa-${saved ? "solid" : "regular"} fa-bookmark"></i> ${saved ? "Saved" : "Save"}
            </button>
            <button class="apply-btn" data-apply-job="${job.id}" type="button">
              Apply Now <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPagination() {
    const container = el("pagination");
    if (!container) return;

    const pages = Math.ceil(state.filteredJobs.length / state.perPage);
    if (pages <= 1) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = Array.from({ length: pages }, (_, index) => {
      const page = index + 1;
      return `<button class="${page === state.page ? "active" : ""}" data-page="${page}" type="button">${page}</button>`;
    }).join("");
  }

  function persistSavedJobs() {
    localStorage.setItem("savedJobIds", JSON.stringify([...state.saved]));
  }

  async function applyJob(jobId) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to apply");
      window.location.href = "/login.html";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${jobId}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      alert(data.message || (res.ok ? "Application submitted" : "Unable to apply right now"));
    } catch (error) {
      console.warn(error);
      alert("Unable to apply right now");
    }
  }

  function saveJob(jobId) {
    const numericId = Number(jobId);
    if (state.saved.has(numericId)) {
      state.saved.delete(numericId);
    } else {
      state.saved.add(numericId);
    }
    persistSavedJobs();
    renderJobs();
  }

  async function runSearch(resetPage = true) {
    if (resetPage) state.page = 1;
    await fetchJobs();
    applyLocalFilters();
    renderJobs();
    renderPagination();
  }

  function bindEvents() {
    el("jobSearchForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch();
    });

    ["location", "type", "remote"].forEach((id) => {
      el(id)?.addEventListener("input", () => runSearch());
      el(id)?.addEventListener("change", () => runSearch());
    });

    el("matchRange")?.addEventListener("input", (event) => {
      el("matchValue").textContent = event.target.value;
      applyLocalFilters();
      state.page = 1;
      renderJobs();
      renderPagination();
    });

    el("clearFilters")?.addEventListener("click", () => {
      ["keyword", "location", "type", "remote"].forEach((id) => {
        const field = el(id);
        if (field) field.value = "";
      });
      el("matchRange").value = 65;
      el("matchValue").textContent = "65";
      runSearch();
    });

    el("mobileFilterToggle")?.addEventListener("click", () => {
      el("filtersPanel")?.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
      const pageButton = event.target.closest("[data-page]");
      const saveButton = event.target.closest("[data-save-job]");
      const applyButton = event.target.closest("[data-apply-job]");
      const chipButton = event.target.closest("[data-keyword]");

      if (pageButton) {
        state.page = Number(pageButton.dataset.page);
        renderJobs();
        renderPagination();
      }

      if (saveButton) saveJob(saveButton.dataset.saveJob);
      if (applyButton) applyJob(applyButton.dataset.applyJob);

      if (chipButton) {
        el("keyword").value = chipButton.dataset.keyword;
        runSearch();
      }
    });
  }

  window.WorkYaarJobs = {
    init: () => {
      bindEvents();
      runSearch();
    },
    search: runSearch
  };
})();
