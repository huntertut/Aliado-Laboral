async function main() {
  try {
    console.log("Calling login...");
    const loginRes = await fetch("https://api.cibertmx.org/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "Verónica@2099" })
    });
    
    if (!loginRes.ok) throw new Error("Login failed: " + await loginRes.text());
    
    const { token } = await loginRes.json();
    console.log("Got token");
    
    console.log("Calling sync-firebase...");
    const syncRes = await fetch("https://api.cibertmx.org/api/admin/users/sync-firebase", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    const result = await syncRes.text();
    console.log("Sync Response:", result);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();
