import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool, types } = pg;
// OID 1082 = tipo DATE de PostgreSQL. Por defecto pg lo convierte a un objeto
// Date de JS, y al pasar por JSON.stringify se vuelve un timestamp completo
// (ej. "2026-08-05T00:00:00.000Z") en lugar de "2026-08-05". El cliente espera
// el string plano "YYYY-MM-DD", así que lo dejamos tal cual llega de la BD.
types.setTypeParser(1082, value => value);
export const pool = new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME, max: 10, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });