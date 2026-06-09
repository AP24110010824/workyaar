"use strict";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = window.location.origin + "/api";

const JOBSEEKER_API = `${API_BASE}/jobseeker`;
const JOB_API = `${API_BASE}/jobs`;
const SAVED_API = `${API_BASE}/saved-jobs`;
const INTERVIEW_API = `${API_BASE}/interviews`;

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initMenu();
  initTabs();
  initLogout();
  initPreviewListeners();

  loadProfile();
  loadResume();
  loadDashboardStats();
  loadCategories();
  loadRecommended();

});

/* =========================================================
   HELPERS
========================================================= */

const getEl = (id) => document.getElementById(id);

const getVal = (id) => {
  return getEl(id)?.value || "";
};

const setVal = (id, val) => {
  if (getEl(id)) {
    getEl(id).value = val || "";
  }
};

const setText = (id, val) => {
  if (getEl(id)) {
    getEl(id).innerText = val || "";
  }
};

/* =========================================================
   MENU
========================================================= */

function initMenu() {

  const items = document.querySelectorAll(".menu-item");

  items.forEach(item => {

    item.addEventListener("click", () => {

      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
      });

      const target = item.dataset.section;

      getEl(target)?.classList.add("active");

      setText("pageTitle", item.innerText);

      if (target === "jobs") loadJobs();

      if (target === "applications") loadApplications();

      if (target === "saved") loadSavedJobs();

      if (target === "interviews") loadInterviews();

          if (target === "discover") loadDiscover();

          if (target === "gigs") loadGigs();

    });

  });

}

/* =========================================================
   PROFILE TABS
========================================================= */

function initTabs() {

  const tabs = document.querySelectorAll(".profile-tab");

  const contents = document.querySelectorAll(".profile-content");

  tabs.forEach(tab => {

    tab.addEventListener("click", () => {

      tabs.forEach(t => t.classList.remove("active"));

      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");

      const target = tab.dataset.tab;

      getEl(target)?.classList.add("active");

    });

  });

}

async function loadJobs() {

  try {

    const url = `${JOB_API}?keyword=${getVal("keyword")}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    const container = getEl("jobsList");

    if (!container) return;

    container.innerHTML = "";

    if (!data.jobs || !data.jobs.length) {
      container.innerHTML = `<p>No jobs found</p>`;
      return;
    }

    /* applied jobs */
    const appliedRes = await fetch(`${JOB_API}/my/applications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const appliedData = await appliedRes.json();

    const appliedIds = appliedData.applications?.map(a => a.job_id) || [];

    /* LOOP START */
    data.jobs.forEach(job => {

      const applied = appliedIds.includes(job.id);

      container.innerHTML += `
      
      <div class="card job-card">

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">

          <img 
            src="${job.logo ? 'https://workyaar.com' + job.logo : 'images/company.png'}"
            width="45"
            height="45"
            style="border-radius:8px;object-fit:cover;border:1px solid #ddd;"
          >

          <div>

            <h4 style="margin:0;">
              ${job.company_name || "Company"}
            </h4>

            <small style="color:#777;">
              ${job.employer_type || "Employer"}
            </small>

          </div>

        </div>

        <h4>${job.title}</h4>

        <small>📍 ${job.location || "N/A"}</small><br>

        <small>💰 ₹${job.salary_min || 0} - ₹${job.salary_max || 0}</small>

        <br><br>

        <button 
          ${applied ? "disabled" : ""}
          onclick="applyJob(${job.id})">

          ${applied ? "Applied" : "Apply Job"}

        </button>

        <button onclick="toggleSave(${job.id})">
          Save
        </button>

      </div>

      `;

    });

  } catch (err) {

    console.error("Load Jobs Error:", err);

  }

}

/* =========================================================
   APPLY JOB
========================================================= */

async function applyJob(id) {

  try {

    const res = await fetch(`${JOB_API}/${id}/apply`, {

      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`
      }

    });

    if (res.ok) {

      alert("Applied Successfully");

      loadJobs();

      loadApplications();

    } else {

      alert("Apply Failed");

    }

  } catch (err) {

    console.error(err);

  }

}

/* =========================================================
   APPLICATIONS
========================================================= */

async function loadApplications() {

  try {

    const res = await fetch(`${JOB_API}/my/applications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    const container = getEl("applicationsList");

    if (!container) return;

    container.innerHTML = "";

    if (!data.applications || !data.applications.length) {

      container.innerHTML = `<p>No applications found</p>`;

      return;

    }

    data.applications.forEach(app => {

      container.innerHTML += `
      
      <div class="card">

        <h4>${app.title}</h4>

        <p>${app.company_name || ""}</p>

        <small>📍 ${app.location || ""}</small>

        <br><br>

        <span class="status ${app.status}">
          ${app.status}
        </span>

      </div>

      `;

    });

  } catch (err) {

    console.error(err);

  }

}

/* =========================================================
   SAVE JOB
========================================================= */

async function toggleSave(id) {

  try {

    await fetch(`${SAVED_API}/${id}`, {

      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`
      }

    });

    alert("Job Saved");

  } catch (err) {

    console.error(err);

  }

}

/* =========================================================
   SAVED JOBS
========================================================= */

async function loadSavedJobs() {

  try {

    const res = await fetch(`${SAVED_API}`, {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });

    const data = await res.json();

    const container = getEl("savedJobsList");

    if (!container) return;

    container.innerHTML = "";

    if (!data.jobs || !data.jobs.length) {

      container.innerHTML = `<p>No saved jobs</p>`;

      return;

    }

    data.jobs.forEach(job => {

      container.innerHTML += `
      
      <div class="card">

        <h4>${job.title}</h4>

        <p>${job.company_name || ""}</p>

        <button onclick="applyJob(${job.id})">
          Apply
        </button>

      </div>

      `;

    });

  } catch (err) {

    console.error(err);

  }

}

/* =========================================================
   INTERVIEWS
========================================================= */

async function loadInterviews() {

  try {

    const res = await fetch(`${INTERVIEW_API}`, {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });

    const data = await res.json();

    const container = getEl("interviewList");

    if (!container) return;

    container.innerHTML = "";

    if (!data.interviews || !data.interviews.length) {

      container.innerHTML = `<p>No interviews scheduled</p>`;

      return;

    }

    data.interviews.forEach(i => {

      container.innerHTML += `
      
      <div class="card">

        <h4>${i.job_title}</h4>

        <p>${i.company_name}</p>

        <small>📅 ${i.date}</small><br>

        <small>⏰ ${i.time}</small><br>

        <small>Mode: ${i.mode}</small>

        <br><br>

        <button>
          Join
        </button>

      </div>

      `;

    });

  } catch (err) {

    console.error(err);

  }

}

/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

  try {

    const res = await fetch(`${JOBSEEKER_API}/profile`, {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });

    const data = await res.json();

    console.log("PROFILE API:", data);

    const u = data.profile || data.user || {};

    setVal("full_name", u.full_name || u.name);
    setVal("email", u.email);
    setVal("mobile", u.phone || u.mobile);
    setVal("location", u.location || u.city);
    setVal("experience", u.experience);
    setVal("summary", u.summary || u.bio);
    setVal("linkedin", u.linkedin);
    setVal("github", u.github);
    setVal("portfolio", u.portfolio);

    setText(
      "welcomeName",
      u.full_name || u.name || "Jobseeker"
    );

  } catch (err) {

    console.error("Profile Error:", err);

  }

}

/* =========================================================
   RESUME
========================================================= */

/* =========================================================
   LOAD RESUME
========================================================= */

async function loadResume() {

  try {

    const res = await fetch(
      `${API_BASE}/resume`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    console.log("RESUME API:", data);

    const status = getEl("resumeStatus");

    if (!status) return;

    /* NO RESUME */

    if (!data.success || !data.resume) {

      status.innerHTML = `

      <div style="
      padding:15px;
      border:1px dashed #ccc;
      border-radius:10px;
      background:#fafafa;
      ">

        <p style="
        color:#888;
        font-size:14px;
        ">

        No resume uploaded

        </p>

      </div>

      `;

      return;

    }

    /* SHOW RESUME */

    status.innerHTML = `

    <div style="
    padding:15px;
    border:1px solid #ddd;
    border-radius:10px;
    background:#f9fbff;
    ">

      <p style="
      font-weight:600;
      color:#1f4571;
      margin-bottom:10px;
      ">

        ${data.resume.name}

      </p>

      <a href="https://workyaar.com${data.resume.url}"
         target="_blank">

         View Resume

      </a>

      <a href="https://workyaar.com${data.resume.url}"
         download
         style="
         margin-left:10px;
         background:#28a745;
         ">

         Download Resume

      </a>

    </div>

    `;

  } catch (err) {

    console.error("Resume Load Error:", err);

  }

}
/* =========================================================
   UPLOAD RESUME
========================================================= */

async function uploadResume() {

  try {

    const fileInput = getEl("resumeUpload");

    const file = fileInput.files[0];

    if (!file) {

      alert("Please select a resume");

      return;

    }

    const formData = new FormData();

    formData.append("resume", file);

    const res = await fetch(
      `${API_BASE}/resume`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`
        },

        body: formData
      }
    );

    const data = await res.json();

    console.log("UPLOAD API:", data);

    if (data.success) {

      alert("Resume uploaded successfully");

      loadResume();

    } else {

      alert(data.message || "Upload failed");

    }

  } catch (err) {

    console.error("Resume Upload Error:", err);

    alert("Upload failed");

  }

}

/* =========================================================
   DASHBOARD STATS
========================================================= */

async function loadDashboardStats() {

  try {

    const res = await fetch(`${JOBSEEKER_API}/dashboard`, {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });

    const data = await res.json();

    const s = data.stats || {};

    setText("appliedCount", s.applied_jobs || 0);

    setText("savedCount", s.saved_jobs || 0);

  } catch (err) {

    console.error(err);

  }

}

/* =========================================================
   CATEGORIES
========================================================= */

function loadCategories() {

  console.log("Categories Loaded");

}


/* =========================================================
   RECOMMENDED / DISCOVER / GIGS
========================================================= */

async function loadRecommended() {
  try {
    const res = await fetch(`${JOB_API}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    const container = getEl("recommendedJobs");
    if (!container) return;

    container.innerHTML = "";

    const jobs = (data.jobs || []).slice(0, 4);

    if (!jobs.length) {
      container.innerHTML = `<div style=\"color:var(--muted);font-size:13px;grid-column:1/-1;\">No recommendations yet</div>`;
      return;
    }

    jobs.forEach(job => {
      container.innerHTML += `
        <div class="job-card">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
            <img src="${job.logo ? 'https://workyaar.com' + job.logo : '/images/company.png'}" width="40" height="40" style="border-radius:8px;object-fit:cover;border:1px solid #ddd;">
            <div style="font-size:13px;font-weight:700;">${job.company_name || 'Company'}</div>
          </div>
          <div style="font-weight:800;font-size:15px;margin-bottom:6px;">${job.title}</div>
          <div style="font-size:13px;color:var(--muted);">${job.location || ''}</div>
        </div>
      `;
    });

  } catch (err) {
    console.error('loadRecommended error:', err);
  }
}

async function loadDiscover() {
  try {
    const res = await fetch(`${JOB_API}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    const container = getEl("discoverList");
    if (!container) return;

    container.innerHTML = "";

    const jobs = data.jobs || [];
    if (!jobs.length) {
      container.innerHTML = `<div style=\"color:var(--muted);font-size:13px;\">No jobs found</div>`;
      return;
    }

    jobs.slice(0, 20).forEach(job => {
      container.innerHTML += `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:800;">${job.title}</div>
              <div style="font-size:13px;color:var(--muted);">${job.company_name || ''} • ${job.location || ''}</div>
            </div>
            <div>
              <button class="btn btn-primary" onclick="applyJob(${job.id})">Apply</button>
            </div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error('loadDiscover error:', err);
  }
}

async function loadGigs() {
  try {
    // No dedicated gigs endpoint; fetch jobs and filter for job_type that may indicate gigs
    const res = await fetch(`${JOB_API}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    const container = getEl("gigsList");
    if (!container) return;

    container.innerHTML = "";

    const jobs = (data.jobs || []).filter(j => (j.job_type || '').toLowerCase().includes('gig') || j.job_type === null);

    // Fallback: if no explicit gigs, show a subset of recent jobs
    const list = jobs.length ? jobs : (data.jobs || []).slice(0, 8);

    if (!list.length) {
      container.innerHTML = `<div style=\"color:var(--muted);font-size:13px;\">No gigs found</div>`;
      return;
    }

    list.forEach(job => {
      container.innerHTML += `
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding:12px 0;">
          <div>
            <div style="font-weight:700;">${job.title}</div>
            <div style="font-size:12px;color:var(--muted);">${job.company_name || ''} • ${job.location || ''}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline" onclick="applyJob(${job.id})">Apply</button>
            <button class="btn" onclick="toggleSave(${job.id})">Save</button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error('loadGigs error:', err);
  }
}

/* =========================================================
   LOGOUT
========================================================= */

function initLogout() {

  const btn = getEl("logoutBtn");

  if (!btn) return;

  btn.addEventListener("click", () => {

    localStorage.removeItem("token");

    window.location.href = "login.html";

  });

}

/* =========================================================
   IMAGE / RESUME PREVIEW
========================================================= */

function initPreviewListeners() {

  console.log("Preview Listener Loaded");

}

/* =========================================================
   ENABLE PROFILE EDIT
========================================================= */

function enableEdit() {

  const fields = [
    "full_name",
    "mobile",
    "location",
    "experience",
    "summary"
  ];

  fields.forEach(id => {
    const el = getEl(id);

    if (el) {
      el.disabled = false;
    }
  });

  // show save button
  getEl("saveBtn").style.display = "inline-block";

  // hide edit button
  getEl("editBtn").style.display = "none";

}

/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveProfile() {

  try {

    const payload = {

      full_name: getVal("full_name"),
      mobile: getVal("mobile"),
      location: getVal("location"),
      experience: getVal("experience"),
      summary: getVal("summary"),

      linkedin: getVal("linkedin"),
      github: getVal("github"),
      portfolio: getVal("portfolio")

    };

    console.log("SAVE PAYLOAD:", payload);

    const res = await fetch(
      `${JOBSEEKER_API}/profile`,
      {

        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(payload)

      }
    );

    const data = await res.json();

    console.log("SAVE RESPONSE:", data);

    if (!res.ok) {

      alert(data.message || "Profile update failed");

      return;

    }

    alert("Profile updated successfully");

    // disable fields again
    const fields = [
      "full_name",
      "mobile",
      "location",
      "experience",
      "summary"
    ];

    fields.forEach(id => {

      const el = getEl(id);

      if (el) {
        el.disabled = true;
      }

    });

    getEl("saveBtn").style.display = "none";

    getEl("editBtn").style.display = "inline-block";

    // reload profile preview
    loadProfile();

  } catch (err) {

    console.error("Save Profile Error:", err);

    alert("Something went wrong");

  }

}