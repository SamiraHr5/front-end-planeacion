async function loadPartials() {
  const header = await fetch("/partials/header.html").then(r => r.text());
  const footer = await fetch("/partials/footer.html").then(r => r.text());

  const h = document.getElementById("header-container");
  const f = document.getElementById("footer-container");

  if (h) h.innerHTML = header;
  if (f) f.innerHTML = footer;

  // Logout
  const logout = document.getElementById("logoutLink");
  if (logout) {
    logout.addEventListener("click", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (token) await fetch("/api/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  }
}

loadPartials();