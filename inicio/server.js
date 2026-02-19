const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const USERS_PATH = path.join(__dirname, "users.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), "utf-8");
}

//registro
app.post("/api/register", (req, res) => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan campos." });
  }

  const users = readUsers();
  const exists = users.some(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );

  if (exists) {
    return res.status(409).json({ ok: false, message: "Usuario ya existe." });
  }

  const newUser = {
    id: Date.now(),
    name: String(name),
    email: String(email),
    username: String(username),
    password: String(password) 
  };

  users.push(newUser);
  writeUsers(users);

  console.log("Nuevo registro:", { id: newUser.id, username: newUser.username, email: newUser.email });

  return res.json({ ok: true });
});

//login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan credenciales." });
  }

  const users = readUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === String(username).toLowerCase() &&
      u.password === String(password)
  );

  if (!user) {
    return res.status(401).json({ ok: false, message: "Usuario o contraseña incorrectos." });
  }

  console.log("Login:", { id: user.id, username: user.username });
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
