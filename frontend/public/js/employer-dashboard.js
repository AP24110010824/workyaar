"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = `${window.location.origin}/api`;
  const token = localStorage.getItem("token");

  const fallbackJobs = [
    { id: 701, title: "Senior Frontend Engineer", category_name: "Engineering", location: "Remote", salary_min: 150000, salary_max: 210000, applicants: 48, is_active: 1 },
    { id: 702, title: "Principal Product Designer", category_name: "Design", location: "New York", salary_min: 160000, salary_max: 220000, applicants: 32, is_active: 1 },
    { id: 703, title: "Backend Lead (Node.js)", category_name: "Engineering", location: "Hybrid", salary_min: 145000, salary_max: 195000, applicants: 15, is_active: 1 }
  ];

  const fallbackApplications = [
    { id: 1, full_name: "Marcus Aurelius", title: "Senior Frontend Engineer", status: "shortlisted" },
    { id: 2, full_name: "Saba Khan", title: "Principal Product Designer", status: "processed" },
    { id: 3, full_name: "Jordan Smith", title: "Backend Lead (Node.js)", status: "applied" }
  ];

  const fallbackProfile = {
    company_name: "InnovateTech",
    employer_type: "company",
    industry: "Technology",
    company_size: "50-200",
    founded_year: "2018",
    hiring_status: "active",
    phone: "+1 555 0148",
    email: "hiring@innovatetech.com",
    website: "https://innovatetech.com",
    linkedin: "https://linkedin.com/company/innovatetech",
    office_address: "San Francisco, CA",
    country: "United States",
    state: "California",
    city: "San Francisco",
    description: "A product-led technology company building elegant tools for modern teams."
  };

  const safe = (id) => document.getElementById(id);
  const money = (value) => value ? `$${Number(value).toLocaleString()}` : "";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

  async function apiFetch(url, options = {}) {
    if (!token) return null;

    try {
      const headers = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      };

      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem("token");
        return null;
      }

      return await res.json().catch(() => null);
    } catch (error) {
      console.warn("Employer API error:", error);
      return null;
    }
  }

  function setText(id, value) {
    const target = safe(id);
    if (target) target.textContent = value;
  }

  function initials(name) {
    return String(name || "WorkYaar").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function updateCompanyBrand(profile = fallbackProfile) {
    const name = profile?.company_name || fallbackProfile.company_name;
    setText("sidebarCompanyName", name);
    setText("companyWelcome", name);
    setText("companyAvatar", initials(name));
  }

  function updateEmployerBadge() {
    const type = safe("employer_type")?.value || "company";
    const badge = safe("badgeBox");
    if (!badge) return;

    const labels = {
      company: "Verified Company",
      agency: "Consultancy Partner",
      recruiter: "Recruiter Account"
    };
    badge.textContent = labels[type] || "Employer Profile";
  }

  function showSection(sectionId) {
    document.querySelectorAll(".menu-item[data-section]").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === sectionId);
    });

    document.querySelectorAll(".section").forEach((section) => {
      section.classList.toggle("active", section.id === sectionId);
    });

    const activeItem = document.querySelector(`.menu-item[data-section="${sectionId}"]`);
    setText("pageTitle", activeItem?.textContent.trim() || "Overview");
    safe("employerSidebar")?.classList.remove("open");

    if (sectionId === "profile") loadCompanyProfile();
    if (sectionId === "myjobs") loadJobs();
    if (sectionId === "applications") loadApplications();
    if (sectionId === "postjob") loadCategories();
  }

  function bindNavigation() {
    document.querySelectorAll("[data-section]").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        history.replaceState(null, "", item.getAttribute("href") || `#${item.dataset.section}`);
        showSection(item.dataset.section);
      });
    });

    document.querySelectorAll("[data-section-jump]").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        history.replaceState(null, "", item.getAttribute("href") || `#${item.dataset.sectionJump}`);
        showSection(item.dataset.sectionJump);
      });
    });

    safe("employerMenuBtn")?.addEventListener("click", () => {
      safe("employerSidebar")?.classList.toggle("open");
    });

    safe("logoutBtn")?.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/login.html";
    });

    safe("employer_type")?.addEventListener("change", updateEmployerBadge);
    safe("industry_type")?.addEventListener("change", loadIndustryCategories);
  }

  function setProfileDisabled(disabled) {
    document.querySelectorAll("#profile input, #profile select, #profile textarea").forEach((field) => {
      field.disabled = disabled;
    });
    safe("editBtn").style.display = disabled ? "inline-flex" : "none";
    safe("saveBtn").style.display = disabled ? "none" : "inline-flex";
  }

  function bindProfileEditing() {
    setProfileDisabled(true);

    safe("editBtn")?.addEventListener("click", () => setProfileDisabled(false));
    safe("saveBtn")?.addEventListener("click", async () => {
      await saveProfile();
      setProfileDisabled(true);
    });
  }

  async function loadDashboardStats() {
    const data = await apiFetch(`${API_BASE}/employer/dashboard-stats`);
    const stats = data?.stats || {
      total_jobs: fallbackJobs.length,
      total_applications: fallbackApplications.length,
      total_shortlisted: fallbackApplications.filter((app) => app.status === "shortlisted").length,
      total_interviews: fallbackApplications.filter((app) => app.status === "processed").length
    };

    setText("jobCount", stats.total_jobs || 0);
    setText("appCount", stats.total_applications || 0);
    setText("shortCount", stats.total_shortlisted || 0);
    setText("intCount", stats.total_interviews || 0);
  }

  async function loadCompanyProfile() {
    const data = await apiFetch(`${API_BASE}/employer/company-profile`);
    const profile = data?.profile || fallbackProfile;
    const set = (id, value) => {
      const field = safe(id);
      if (field) field.value = value ?? "";
    };

    set("company_name", profile.company_name);
    set("employer_type", profile.employer_type || "company");
    set("industry", profile.industry);
    set("company_size", profile.company_size);
    set("founded_year", profile.founded_year);
    set("hiring_status", profile.hiring_status || "active");
    set("pwd_hiring", profile.pwd_hiring);
    set("ngo_type", profile.ngo_type);
    set("office_address", profile.office_address || profile.location);
    set("about", profile.description || profile.about);
    set("gst", profile.gst);
    set("country", profile.country);
    set("state", profile.state);
    set("city", profile.city);
    set("phone", profile.phone);
    set("email", profile.email);
    set("website", profile.website);
    set("linkedin", profile.linkedin);

    updateCompanyBrand(profile);
    updateEmployerBadge();
  }

  async function saveProfile() {
    if (!token) {
      alert("Please login to save company profile changes.");
      return;
    }

    const payload = {
      company_name: safe("company_name")?.value,
      employer_type: safe("employer_type")?.value,
      industry: safe("industry")?.value,
      company_size: safe("company_size")?.value,
      founded_year: safe("founded_year")?.value,
      hiring_status: safe("hiring_status")?.value,
      pwd_hiring: safe("pwd_hiring")?.value,
      ngo_type: safe("ngo_type")?.value,
      office_address: safe("office_address")?.value,
      location: safe("office_address")?.value,
      description: safe("about")?.value,
      gst: safe("gst")?.value,
      country: safe("country")?.value,
      state: safe("state")?.value,
      city: safe("city")?.value,
      phone: safe("phone")?.value,
      email: safe("email")?.value,
      website: safe("website")?.value,
      linkedin: safe("linkedin")?.value
    };

    const res = await apiFetch(`${API_BASE}/employer/company-profile`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res?.success) {
      alert("Profile updated successfully");
      updateCompanyBrand(payload);
    } else {
      alert("Profile update failed");
    }
  }

  async function loadIndustryCategories() {
    const select = safe("industry");
    if (!select) return;

    const type = safe("industry_type")?.value;
    const fallback = type === "creative"
      ? ["Design", "Media", "Brand"]
      : type === "business"
        ? ["Finance", "Operations", "Consulting"]
        : ["Software", "AI / ML", "Cloud"];

    select.innerHTML = fallback.map((name) => `<option value="${name}">${name}</option>`).join("");
  }

  async function loadCategories() {
    const select = safe("category_id");
    if (!select) return;

    const data = await apiFetch(`${API_BASE}/jobs/categories`) ||
      await fetch(`${API_BASE}/jobs/categories`).then((res) => res.json()).catch(() => null);

    const categories = data?.categories?.length ? data.categories : [
      { id: 1, name: "Software Development" },
      { id: 2, name: "Data Science" },
      { id: 3, name: "Design" }
    ];

    select.innerHTML = `<option value="">Select category</option>` +
      categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("");
  }

  function renderRecentJobs(jobs) {
    const container = safe("recentJobsList");
    if (!container) return;

    container.innerHTML = jobs.slice(0, 4).map((job) => `
      <article class="mini-posting">
        <div class="mini-icon">${initials(job.title)}</div>
        <div>
          <strong>${escapeHtml(job.title || "Untitled role")}</strong>
          <span>${escapeHtml(job.category_name || "Role")} - ${escapeHtml(job.location || "Remote")}</span>
        </div>
        <div class="mini-pill">${job.applicants || 0} Applicants</div>
      </article>
    `).join("") || `<div class="mini-posting"><div>No active postings yet.</div></div>`;
  }

  async function loadJobs() {
    const data = await apiFetch(`${API_BASE}/jobs/my-jobs`);
    const jobs = data?.jobs?.length ? data.jobs : fallbackJobs;
    const tbody = safe("jobsTable");

    renderRecentJobs(jobs);
    if (!tbody) return;

    tbody.innerHTML = jobs.map((job) => {
      const salary = money(job.salary_min) || money(job.salary_max)
        ? `${money(job.salary_min)}${job.salary_min && job.salary_max ? " - " : ""}${money(job.salary_max)}`
        : "Competitive";

      return `
        <tr>
          <td>${escapeHtml(job.title || "Untitled role")}</td>
          <td>${escapeHtml(job.category_name || "-")}</td>
          <td>${escapeHtml(job.location || "Remote")}</td>
          <td>${salary}</td>
          <td><button class="table-action" onclick="deleteJob(${Number(job.id)})" type="button">Delete</button></td>
        </tr>
      `;
    }).join("");
  }

  function renderRecentApplications(applications) {
    const container = safe("recentApplicationsList");
    if (!container) return;

    container.innerHTML = applications.slice(0, 4).map((app) => `
      <article class="mini-application">
        <div class="mini-icon">${initials(app.full_name)}</div>
        <div>
          <strong>${escapeHtml(app.full_name || "Candidate")}</strong>
          <span>${escapeHtml(app.title || app.job_title || "Open role")}</span>
        </div>
        <div class="mini-pill">${escapeHtml(app.status || "applied")}</div>
      </article>
    `).join("") || `<div class="mini-application"><div>No applications yet.</div></div>`;
  }

  async function loadApplications() {
    const data = await apiFetch(`${API_BASE}/employer/applications`);
    const applications = data?.applications?.length ? data.applications : fallbackApplications;
    const tbody = safe("applicationsTable");

    renderRecentApplications(applications);
    if (!tbody) return;

    tbody.innerHTML = applications.map((app) => `
      <tr>
        <td>${escapeHtml(app.full_name || "Candidate")}</td>
        <td>${escapeHtml(app.title || app.job_title || "-")}</td>
        <td><span class="status-pill">${escapeHtml(app.status || "applied")}</span></td>
        <td><button class="secondary-action" type="button">View</button></td>
      </tr>
    `).join("");
  }

  window.createJob = async function createJob() {
    if (!token) {
      alert("Please login as an employer to post a job.");
      return;
    }

    const payload = {
      title: safe("title")?.value.trim(),
      location: safe("location_job")?.value.trim(),
      category_id: safe("category_id")?.value,
      job_type: safe("job_type")?.value,
      experience_level: safe("experience")?.value.trim(),
      salary_min: safe("salary_min")?.value,
      salary_max: safe("salary_max")?.value,
      description: safe("description")?.value.trim()
    };

    if (!payload.title || !payload.category_id || !payload.description) {
      alert("Please fill job title, category, and description.");
      return;
    }

    const res = await apiFetch(`${API_BASE}/jobs`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res?.success) {
      alert("Job posted successfully");
      document.querySelectorAll("#postjob input, #postjob textarea").forEach((field) => {
        field.value = "";
      });
      loadJobs();
      loadDashboardStats();
      showSection("myjobs");
    } else {
      alert(res?.message || "Job posting failed");
    }
  };

  window.deleteJob = async function deleteJob(id) {
    if (!token) {
      alert("Please login as an employer to delete jobs.");
      return;
    }

    if (!confirm("Delete this job?")) return;

    const res = await apiFetch(`${API_BASE}/jobs/${id}`, { method: "DELETE" });
    if (res?.success) {
      loadJobs();
      loadDashboardStats();
    } else {
      alert(res?.message || "Unable to delete job");
    }
  };

  bindNavigation();
  bindProfileEditing();
  loadDashboardStats();
  loadIndustryCategories();
  loadCategories();
  loadCompanyProfile();
  loadJobs();
  loadApplications();

  const initialSection = window.location.hash?.replace("#", "");
  if (initialSection && safe(initialSection)) {
    showSection(initialSection);
  }
});
