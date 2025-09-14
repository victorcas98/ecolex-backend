import { Router } from "express";
import pool from "../config/db.js";
const router = Router();

router.get("/", async (req, res) => {
  const r = await pool.query("SELECT * FROM projetos ORDER BY id");
  res.json(r.rows);
});

router.post("/", async (req, res) => {
  const { nome, responsavel } = req.body;
  const r = await pool.query(
    "INSERT INTO projetos (nome, responsavel) VALUES ($1, $2) RETURNING *",
    [nome, responsavel]
  );
  res.status(201).json(r.rows[0]);
});

export default router;
