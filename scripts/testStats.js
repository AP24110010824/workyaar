const http = require("http");

// Step 1: Login to get a token
const loginData = JSON.stringify({
  email: "employer@test.com",
  password: "EmployerPass123!"
});

const loginOptions = {
  hostname: "localhost",
  port: 5002,
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    const data = JSON.parse(body);
    if (!data.success) {
      console.error("Login failed in test:", data);
      return;
    }
    console.log("Login success. Token obtained:", data.token.slice(0, 20) + "...");
    
    // Step 2: Use token to call stats endpoint
    const statsOptions = {
      hostname: "localhost",
      port: 5002,
      path: "/api/employer/dashboard-stats",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${data.token}`
      }
    };
    
    const statsReq = http.request(statsOptions, (statsRes) => {
      console.log(`Stats Response Status: ${statsRes.statusCode}`);
      let statsBody = "";
      statsRes.on("data", (chunk) => statsBody += chunk);
      statsRes.on("end", () => {
        console.log("Stats Response:", statsBody);
      });
    });
    statsReq.on("error", (e) => console.error("Stats request error:", e));
    statsReq.end();
  });
});

loginReq.on("error", (e) => console.error("Login request error:", e));
loginReq.write(loginData);
loginReq.end();
