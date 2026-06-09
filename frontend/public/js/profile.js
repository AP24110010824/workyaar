"use strict";

const API_BASE = window.location.origin + "/api/jobseeker";

document.addEventListener("DOMContentLoaded", loadProfile);

/* ================================
   LOAD PROFILE
================================ */

async function loadProfile() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success) return;

    const p = data.profile;

    document.getElementById("name").value = p.full_name || "";
    document.getElementById("email").value = p.email || "";
    document.getElementById("phone").value = p.phone || "";
    document.getElementById("location").value = p.location || "";
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

/* ================================
   UPDATE PROFILE
================================ */

async function updateProfile() {
  try {
    const token = localStorage.getItem("token");

    const full_name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const location = document.getElementById("location").value;

    const res = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name,
        phone,
        location,
      }),
    });

    const data = await res.json();

    alert(data.message);
  } catch (err) {
    console.error("Update profile error:", err);
  }
}