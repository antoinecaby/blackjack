import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_moi",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/me", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ loggedIn: false });
    }

    const [rows] = await pool.query(
      "SELECT id_joueur, pseudo, bankroll_initiale, bankroll_actuelle FROM Joueur WHERE id_joueur = ?",
      [req.session.user.id_joueur],
    );

    if (rows.length === 0) {
      return res.json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Erreur /api/me :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { pseudo, password } = req.body;

    if (!pseudo || !password) {
      return res
        .status(400)
        .json({ message: "Pseudo et mot de passe requis." });
    }

    const [existing] = await pool.query(
      "SELECT id_joueur FROM Joueur WHERE pseudo = ?",
      [pseudo],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Ce pseudo existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO Joueur (pseudo, password, bankroll_initiale, bankroll_actuelle) VALUES (?, ?, 1000, 1000)",
      [pseudo, hashedPassword],
    );

    req.session.user = {
      id_joueur: result.insertId,
      pseudo,
    };

    res.status(201).json({
      message: "Compte créé avec succès.",
    });
  } catch (error) {
    console.error("Erreur /api/register :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { pseudo, password } = req.body;

    if (!pseudo || !password) {
      return res
        .status(400)
        .json({ message: "Pseudo et mot de passe requis." });
    }

    const [rows] = await pool.query("SELECT * FROM Joueur WHERE pseudo = ?", [
      pseudo,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    req.session.user = {
      id_joueur: user.id_joueur,
      pseudo: user.pseudo,
    };

    res.json({
      message: "Connexion réussie.",
    });
  } catch (error) {
    console.error("Erreur /api/login :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur /api/logout :", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de la déconnexion." });
    }

    res.json({ message: "Déconnexion réussie." });
  });
});

app.listen(PORT, () => {
  console.log(`Serveur API lancé sur http://localhost:${PORT}`);
});
