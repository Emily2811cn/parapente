import fs from 'node:fs';
import { pool } from './db.js';
try { await pool.query(fs.readFileSync(new URL('../sql/schema.sql', import.meta.url), 'utf8')); console.log('Base de datos preparada.'); } finally { await pool.end(); }
