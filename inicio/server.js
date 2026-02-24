const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cookieParser = require("cookie-parser"); // ✅ arriba

const app = express();
const PORT = 3000;

const USERS_PATH = path.join(__dirname, "users.json");
const PROTECTED_DIR = path.join(__dirname, "protected");

// token -> userId
const sessions = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ ANTES de las rutas
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

// ✅ ahora lee token de HEADER o COOKIE
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cookieToken = req.cookies?.token || null;

  const token = headerToken || cookieToken;

  if (!token || !sessions.has(token)) {
    return res.status(401).send("No autorizado");
  }

  req.userId = sessions.get(token);
  req.token = token;
  next();
}

// registro
app.post("/api/register", (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan campos." });
  }

  const users = readUsers();
  const exists = users.some(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (exists) return res.status(409).json({ ok: false, message: "Usuario ya existe." });

  const newUser = { id: Date.now(), name, email, username, password };
  users.push(newUser);
  writeUsers(users);

  console.log("Registro:", { id: newUser.id, username: newUser.username, email: newUser.email });
  return res.json({ ok: true });
});

// login: ✅ guarda token en COOKIE
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

  if (!user) return res.status(401).json({ ok: false, message: "Usuario o contraseña incorrectos." });

  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, user.id);

  // ✅ cookie para que el navegador la mande solo
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  console.log("Login:", { id: user.id, username: user.username, token: token.slice(0, 6) + "..." });
  return res.json({ ok: true }); // ya no necesitas enviar token al front
});

// validación
app.get("/api/me", authMiddleware, (req, res) => {
  return res.json({ ok: true, userId: req.userId });
});

// logout: ✅ borra cookie y sesión
app.post("/api/logout", authMiddleware, (req, res) => {
  sessions.delete(req.token);
  res.clearCookie("token");
  return res.json({ ok: true });
});

// rutas protegidas
app.get("/app/page3", authMiddleware, (req, res) => {
  res.sendFile(path.join(PROTECTED_DIR, "page3.html"));
});

app.get("/app/page4", authMiddleware, (req, res) => {
  res.sendFile(path.join(PROTECTED_DIR, "page4.html"));
});

// login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));