<script>
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = document.getElementById("msg");
  msg.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    msg.textContent = "Email and password are required";
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || "Login failed";
      return;
    }

    /* Expected backend response
    {
      success: true,
      token: "...",
      role: "job_seeker",
      status: "active"
    }
    */

    if (data.status !== "active") {
      msg.textContent = "Please verify your email or contact support.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    // Role-based redirect
    if (data.role === "employer") {
      window.location.href = "/employer/dashboard.html";
    } else {
      window.location.href = "/jobseeker/dashboard.html";
    }

  } catch (err) {
    msg.textContent = "Server not reachable. Try again later.";
  }
});
</script>

