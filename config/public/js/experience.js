"use strict";

const API_BASE = window.location.origin + "/api/jobseeker";

document.addEventListener("DOMContentLoaded", loadExperience);

/* ================================
   LOAD EXPERIENCE
================================ */

async function loadExperience() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/experience`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    const list = document.getElementById("experienceList");

    if (!list) return;

    list.innerHTML = "";

    data.experience.forEach((exp) => {
      list.innerHTML += `
        <li>
          ${exp.role} at ${exp.company} (${exp.years} years)
          <button onclick="deleteExperience(${exp.id})">Delete</button>
        </li>
      `;
    });
  } catch (err) {
    console.error("Experience error:", err);
  }
}

/* ================================
   ADD EXPERIENCE
================================ */

async function addExperience() {
  try {
    const token = localStorage.getItem("token");

    const company = document.getElementById("company").value;
    const role = document.getElementById("role").value;
    const years = document.getElementById("years").value;

    await fetch(`${API_BASE}/experience`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company,
        role,
        years,
      }),
    });

    loadExperience();
  } catch (err) {
    console.error("Add experience error:", err);
  }
}

/* ================================
   DELETE EXPERIENCE
================================ */

async function deleteExperience(id) {
  try {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/experience/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    loadExperience();
  } catch (err) {
    console.error("Delete experience error:", err);
  }
}