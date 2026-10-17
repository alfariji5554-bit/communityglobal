
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || true
}));
app.use(express.json({ limit: "1mb" }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

app.get("/", (req, res) => {
  res.json({
    name: "CommunityGlobal API",
    status: "online",
    version: "1.0.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    databaseConfigured: Boolean(supabase)
  });
});

app.post("/api/register", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: "Supabase belum dikonfigurasi."
      });
    }

    const { email, password, username } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof username !== "string"
    ) {
      return res.status(400).json({
        error: "Email, password, dan username wajib diisi."
      });
    }

    if (
      !email.trim() ||
      !/^[a-zA-Z0-9_]{3,24}$/.test(username) ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error: "Periksa email, username (3–24 karakter), dan password (8–72 karakter)."
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { username: username.trim() }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Registrasi diproses. Periksa email jika verifikasi diminta.",
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
      sessionCreated: Boolean(data.session)
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({
      error: "Terjadi kesalahan pada server."
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: "Supabase belum dikonfigurasi."
      });
    }

    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email dan password wajib diisi."
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      return res.status(401).json({
        error: "Email atau password tidak valid."
      });
    }

    return res.json({
      message: "Login berhasil.",
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: data.session
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      error: "Terjadi kesalahan pada server."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CommunityGlobal API berjalan di port ${PORT}`);
});
