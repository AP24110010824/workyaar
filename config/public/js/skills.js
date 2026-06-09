"use strict";

const API_BASE = window.location.origin + "/api/jobseeker";

document.addEventListener("DOMContentLoaded", loadSkills);

/* ================================
   LOAD SKILLS
================================ */

async function loadSkills() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/skills`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    const list = document.getElementById("skillsList");

    if (!list) return;

    list.innerHTML = "";

    data.skills.forEach((skill) => {
      list.innerHTML += `
        <li>
          ${skill.skill_name}
          <button onclick="deleteSkill(${skill.id})">Delete</button>
        </li>
      `;
    });
  } catch (err) {
    console.error("Skills error:", err);
  }
}

/* ================================
   ADD SKILL
================================ */

async function addSkill() {
  try {
    const token = localStorage.getItem("token");

    const skillInput = document.getElementById("skillInput");

    const skill_name = skillInput.value;

    if (!skill_name) return;

    await fetch(`${API_BASE}/skills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ skill_name }),
    });

    skillInput.value = "";

    loadSkills();
  } catch (err) {
    console.error("Add skill error:", err);
  }
}

/* ================================
   DELETE SKILL
================================ */

async function deleteSkill(id) {
  try {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/skills/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    loadSkills();
  } catch (err) {
    console.error("Delete skill error:", err);
  }
}