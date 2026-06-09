"use strict";

document.addEventListener("DOMContentLoaded", function () {

  /* =========================================
     CONFIG
  ========================================= */

  const API_BASE = `${window.location.origin}/api`;
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Session expired");
    window.location.href = "/login.html";
    return;
  }

  /* =========================================
     HELPERS
  ========================================= */

  const safe = (id) => document.getElementById(id);

  const editBtn = safe("editBtn");
  const saveBtn = safe("saveBtn");

  const profileFields = document.querySelectorAll(
    "#profile input, #profile textarea, #profile select"
  );

  /* =========================================
     API WRAPPER
  ========================================= */

  async function apiFetch(url, options = {}) {

    try {

      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {

        alert("Session expired");

        localStorage.clear();

        window.location.href = "/login.html";

        return null;
      }

      return await res.json();

    } catch (err) {

      console.error("API Error:", err);

      return null;
    }

  }

  /* =========================================
     EDIT PROFILE
  ========================================= */

  function disableProfileFields(status = true) {

    profileFields.forEach(el => {

      /* Always enabled dropdowns */
      const alwaysEnabled = [
        "employer_type",
        "industry_type",
        "industry"
      ];

      if (alwaysEnabled.includes(el.id)) {
        el.disabled = false;
        return;
      }

      /* Logo upload */
      if (el.id === "logo") {
        el.disabled = status;
        return;
      }

      /* Remaining fields */
      el.disabled = status;

    });

  }

  /* Default mode */
  disableProfileFields(true);

  /* Button states */
  if (editBtn) {
    editBtn.style.display = "inline-block";
  }

  if (saveBtn) {
    saveBtn.style.display = "none";
  }

  /* Edit button */
  if (editBtn) {

    editBtn.addEventListener("click", () => {

      disableProfileFields(false);

      editBtn.style.display = "none";

      if (saveBtn) {
        saveBtn.style.display = "inline-block";
      }

    });

  }

  /* Save button */
  if (saveBtn) {

    saveBtn.addEventListener("click", async () => {

      await saveProfile();

      disableProfileFields(true);

      saveBtn.style.display = "none";

      if (editBtn) {
        editBtn.style.display = "inline-block";
      }

    });

  }

  /* =========================================
     NAVIGATION
  ========================================= */

  const menuItems = document.querySelectorAll(
    ".menu li[data-section]"
  );

  const sections = document.querySelectorAll(".section");

  menuItems.forEach(item => {

    item.addEventListener("click", function () {

      const sectionId = this.dataset.section;

      menuItems.forEach(i =>
        i.classList.remove("active")
      );

      this.classList.add("active");

      sections.forEach(s =>
        s.classList.remove("active")
      );

      const target = safe(sectionId);

      if (target) {
        target.classList.add("active");
      }

      const title = safe("pageTitle");

      if (title) {
        title.innerText = this.innerText;
      }

      /* Lazy loading */

      if (sectionId === "profile") {
        loadCompanyProfile();
      }

      if (sectionId === "managejobs") {
        loadJobs();
      }

      if (sectionId === "applications") {
        loadApplications();
      }

      if (sectionId === "postjob") {
        loadCategories();
      }

    });

  });

  /* =========================================
     LOGOUT
  ========================================= */

  const logoutBtn = safe("logoutBtn");

  if (logoutBtn) {

    logoutBtn.onclick = () => {

      localStorage.removeItem("token");

      window.location.href = "/login.html";

    };

  }

  /* =========================================
     EMPLOYER UI
  ========================================= */

  function updateEmployerUI() {

    const type = safe("employer_type")?.value;

    const badge = safe("badgeBox");

    if (!badge) return;

    if (type === "company") {

      badge.innerText = "✅ Verified Company";

    } else if (type === "agency") {

      badge.innerText = "🏢 Consultancy";

    } else {

      badge.innerText = "👤 Recruiter";

    }

  }

  const employerType = safe("employer_type");

  if (employerType) {
    employerType.addEventListener(
      "change",
      updateEmployerUI
    );
  }

  /* =========================================
     INDUSTRY DROPDOWN
  ========================================= */

  const industryType = safe("industry_type");

  if (industryType) {
    industryType.addEventListener(
      "change",
      loadIndustryCategories
    );
  }

  async function loadIndustryCategories() {

    const type = safe("industry_type")?.value;

    const industrySelect = safe("industry");

    if (!industrySelect) return;

    if (!type) {

      industrySelect.innerHTML =
        `<option value="">Select Industry</option>`;

      return;
    }

    industrySelect.innerHTML =
      `<option value="">Loading...</option>`;

    try {

      const res = await apiFetch(
        `${API_BASE}/industries?type=${type}`
      );

      industrySelect.innerHTML =
        `<option value="">Select Industry</option>`;

      if (res?.success && res?.data?.length > 0) {

        res.data.forEach(item => {

          industrySelect.innerHTML += `
            <option value="${item.industry_name}">
              ${item.industry_name}
            </option>
          `;

        });

      } else {

        industrySelect.innerHTML =
          `<option value="">No Industries Found</option>`;
      }

    } catch (err) {

      console.error(err);

      industrySelect.innerHTML =
        `<option value="">Error Loading</option>`;

    }

  }

  /* =========================================
     DASHBOARD STATS
  ========================================= */

  async function loadDashboardStats() {

    const data = await apiFetch(
      `${API_BASE}/employer/dashboard-stats`
    );

    if (!data) return;

    const stats = data.stats || {};

    if (safe("jobCount")) {
      safe("jobCount").innerText =
        stats.total_jobs || 0;
    }

    if (safe("appCount")) {
      safe("appCount").innerText =
        stats.total_applications || 0;
    }

    if (safe("shortCount")) {
      safe("shortCount").innerText =
        stats.total_shortlisted || 0;
    }

    if (safe("intCount")) {
      safe("intCount").innerText =
        stats.total_interviews || 0;
    }

  }

  /* =========================================
     LOAD PROFILE
  ========================================= */

  async function loadCompanyProfile() {

    const data = await apiFetch(
      `${API_BASE}/employer/company-profile`
    );

    if (!data) return;

    const p = data.profile || {};

    const set = (id, val) => {

      const el = safe(id);

      if (el) {
        el.value = val ?? "";
      }

    };

    set("company_name", p.company_name);
    set("employer_type", p.employer_type || "company");
    set("industry", p.industry);
    set("company_size", p.company_size);
    set("founded_year", p.founded_year);
    set("hiring_status", p.hiring_status);

    set("pwd_hiring", p.pwd_hiring);
    set("ngo_type", p.ngo_type);

    set("office_address", p.office_address);
    set("gst", p.gst);

    set("country", p.country);
    set("state", p.state);
    set("city", p.city);

    set("phone", p.phone);
    set("email", p.email);

    set("website", p.website);
    set("linkedin", p.linkedin);

    updateEmployerUI();

  }

  /* =========================================
     SAVE PROFILE
  ========================================= */

  async function saveProfile() {

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

      gst: safe("gst")?.value,

      country: safe("country")?.value,
      state: safe("state")?.value,
      city: safe("city")?.value,

      phone: safe("phone")?.value,
      email: safe("email")?.value,

      website: safe("website")?.value,
      linkedin: safe("linkedin")?.value

    };

    const res = await apiFetch(
      `${API_BASE}/employer/company-profile`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    if (res?.success) {

      alert("Profile updated successfully");

    } else {

      alert("Profile update failed");

    }

  }

  /* =========================================
     CATEGORIES
  ========================================= */

  async function loadCategories() {

    const data = await apiFetch(
      `${API_BASE}/categories`
    );

    if (!data) return;

    const select = safe("category_id");

    if (!select) return;

    select.innerHTML =
      `<option value="">Select Category</option>`;

    (data.categories || []).forEach(c => {

      select.innerHTML += `
        <option value="${c.id}">
          ${c.name}
        </option>
      `;

    });

  }

  /* =========================================
     CREATE JOB
  ========================================= */

  window.createJob = async function () {

    const payload = {

      title: safe("title")?.value,
      location: safe("location_job")?.value,
      category_id: safe("category_id")?.value,

      job_type: safe("job_type")?.value,

      experience_level: safe("experience")?.value,

      salary_min: safe("salary_min")?.value,
      salary_max: safe("salary_max")?.value,

      description: safe("description")?.value

    };

    if (!payload.title || !payload.category_id) {

      alert("Please fill required fields");

      return;
    }

    const res = await apiFetch(
      `${API_BASE}/jobs`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    if (res?.success) {

      alert("Job posted successfully");

      loadJobs();

    } else {

      alert("Job posting failed");

    }

  };

  /* =========================================
     LOAD JOBS
  ========================================= */

  async function loadJobs() {

    const data = await apiFetch(
      `${API_BASE}/jobs/my-jobs`
    );

    if (!data) return;

    const tbody = safe("jobsTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    const jobs = data.jobs || [];

    if (jobs.length === 0) {

      tbody.innerHTML =
        `<tr><td colspan="5">No jobs found</td></tr>`;

      return;
    }

    jobs.forEach(j => {

      tbody.innerHTML += `
        <tr>
          <td>${j.title || "-"}</td>
          <td>${j.category_name || "-"}</td>
          <td>${j.location || "-"}</td>
          <td>
            ₹${j.salary_min || 0}
            -
            ₹${j.salary_max || 0}
          </td>
          <td>
            <button onclick="deleteJob(${j.id})">
              Delete
            </button>
          </td>
        </tr>
      `;

    });

  }

  /* =========================================
     DELETE JOB
  ========================================= */

  window.deleteJob = async function (id) {

    if (!confirm("Delete job?")) return;

    const res = await apiFetch(
      `${API_BASE}/jobs/${id}`,
      {
        method: "DELETE"
      }
    );

    if (res?.success) {
      loadJobs();
    }

  };

  /* =========================================
     APPLICATIONS
  ========================================= */

  async function loadApplications() {

    const data = await apiFetch(
      `${API_BASE}/employer/applications`
    );

    if (!data) return;

    const tbody = safe("applicationsTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    (data.applications || []).forEach(a => {

      tbody.innerHTML += `
        <tr>
          <td>${a.full_name || "-"}</td>
          <td>${a.job_title || "-"}</td>
          <td>${a.status || "-"}</td>
        </tr>
      `;

    });

  }

  /* =========================================
     INIT
  ========================================= */

  loadDashboardStats();

  loadIndustryCategories();

  loadCompanyProfile();

  loadCategories();

  loadJobs();

  loadApplications();

});