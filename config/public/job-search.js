"use strict";

const API = "https://workyaar.com/api";

/* =========================
   LOAD COUNTRIES
========================= */
async function loadSearchCountries() {
  const res = await fetch(`${API}/countries`);
  const data = await res.json();

  const el = document.getElementById("search_country");

  el.innerHTML = `<option value="">Country</option>`;

  data.data.forEach(c => {
    el.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

/* =========================
   LOAD STATES
========================= */
async function loadSearchStates(countryId) {
  const el = document.getElementById("search_state");
  const city = document.getElementById("search_city");

  el.innerHTML = `<option>Loading...</option>`;
  city.innerHTML = `<option value="">City</option>`;

  const res = await fetch(`${API}/states/${countryId}`);
  const data = await res.json();

  el.innerHTML = `<option value="">State</option>`;

  data.data.forEach(s => {
    el.innerHTML += `<option value="${s.id}">${s.name}</option>`;
  });
}

/* =========================
   LOAD CITIES
========================= */
async function loadSearchCities(stateId) {
  const el = document.getElementById("search_city");

  el.innerHTML = `<option>Loading...</option>`;

  const res = await fetch(`${API}/cities/${stateId}`);
  const data = await res.json();

  el.innerHTML = `<option value="">City</option>`;

  data.data.forEach(c => {
    el.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

/* =========================
   EVENTS
========================= */
document.addEventListener("DOMContentLoaded", () => {

  loadSearchCountries();

  document.getElementById("search_country").addEventListener("change", e => {
    if (e.target.value) loadSearchStates(e.target.value);
  });

  document.getElementById("search_state").addEventListener("change", e => {
    if (e.target.value) loadSearchCities(e.target.value);
  });

});

/* =========================
   SEARCH JOBS
========================= */
async function searchJobs() {

  const keyword = document.getElementById("keyword").value;

  const country_id = document.getElementById("search_country").value;
  const state_id = document.getElementById("search_state").value;
  const city_id = document.getElementById("search_city").value;

  const is_remote = document.getElementById("search_remote").checked ? 1 : 0;

  const query = new URLSearchParams({
    keyword,
    country_id,
    state_id,
    city_id,
    is_remote
  });

  const res = await fetch(`${API}/jobs/search?${query}`);
  const data = await res.json();

  const list = document.getElementById("jobsList");
  list.innerHTML = "";

  if (!data.jobs || data.jobs.length === 0) {
    list.innerHTML = `<p>No jobs found</p>`;
    return;
  }

  data.jobs.forEach(job => {
    list.innerHTML += `
      <div class="job-card">
        <h3>${job.title}</h3>
        <p>${job.location || "Remote"}</p>
        <small>${job.company_name}</small>
      </div>
    `;
  });

}