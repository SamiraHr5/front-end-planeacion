async function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return;
  }

  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    localStorage.removeItem("token");
    window.location.href = "/";
  }
}

requireAuth();