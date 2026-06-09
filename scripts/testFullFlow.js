const http = require("http");

function httpReq(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  // Step 1: Login
  const loginBody = JSON.stringify({ email: "employer@test.com", password: "EmployerPass123!" });
  const login = await httpReq({
    hostname: "localhost", port: 5002, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": loginBody.length }
  }, loginBody);
  console.log("1. LOGIN:", login.status, login.body.slice(0, 120));

  const data = JSON.parse(login.body);
  if (!data.success) { console.error("Login failed!"); return; }

  const token = data.token;

  // Step 2: Dashboard Stats
  const stats = await httpReq({
    hostname: "localhost", port: 5002, path: "/api/employer/dashboard-stats", method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("2. STATS:", stats.status, stats.body.slice(0, 200));

  // Step 3: Company Profile
  const profile = await httpReq({
    hostname: "localhost", port: 5002, path: "/api/employer/company-profile", method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("3. PROFILE:", profile.status, profile.body.slice(0, 200));

  // Step 4: Categories
  const cats = await httpReq({
    hostname: "localhost", port: 5002, path: "/api/categories", method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("4. CATEGORIES:", cats.status, cats.body.slice(0, 200));

  // Step 5: My Jobs
  const jobs = await httpReq({
    hostname: "localhost", port: 5002, path: "/api/jobs/my-jobs", method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("5. MY JOBS:", jobs.status, jobs.body.slice(0, 200));

  console.log("\n✅ All endpoints tested!");
})().catch(e => console.error("Error:", e));
