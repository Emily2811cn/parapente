import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 250, standardHeaders: true, legacyHeaders: false }));

// Borra automáticamente las invitaciones con más de RETENTION_DAYS desde su creación,
// para que la tabla no siga creciendo. Corre una vez al iniciar la API y luego cada 24h.
const RETENTION_DAYS = 30;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
async function cleanupOldInvitations() {
  try {
    const result = await pool.query(`DELETE FROM invitations WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`);
    if (result.rowCount) console.log(`Limpieza automática: se eliminaron ${result.rowCount} invitación(es) con más de ${RETENTION_DAYS} días.`);
  } catch (e) { console.error('Error en limpieza automática de invitaciones:', e); }
}
cleanupOldInvitations();
setInterval(cleanupOldInvitations, CLEANUP_INTERVAL_MS);

const clean = value => value.trim().replace(/\s+/g, ' ');
const invitationSchema = z.object({
  clientName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(120),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  flightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresa una fecha de vuelo válida.'),
  from: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional()
});
const spanishDate = iso => new Intl.DateTimeFormat('es-EC', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const baseMessage = flightDate => `Ecuador Parapente te invita a acercarte el ${spanishDate(flightDate)} para disfrutar un vuelo en parapente. Este cupón es válido para un vuelo en Montañita.`;
const responseData = row => ({ clientName: row.client_name, birthday: row.birthday, flightDate: row.flight_date, from: row.sender, message: row.message, createdAt: row.created_at });

app.get('/api/health', async (_, res, next) => { try { await pool.query('SELECT 1'); res.json({ status:'ok' }); } catch (e) { next(e); } });
app.post('/api/invitations', async (req, res, next) => { try {
  const parsed = invitationSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const value = parsed.data, id = randomUUID(), sender = clean(value.from || 'ECUADOR PARAPENTE'), message = value.message ? value.message.trim() : baseMessage(value.flightDate);
  const result = await pool.query('INSERT INTO invitations (id, client_name, birthday, flight_date, sender, message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [id, clean(value.clientName), value.birthday || null, value.flightDate, sender, message]);
  const origin = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.status(201).json({ code:id, invitationUrl:`${origin}/invitacion/${id}`, invitation:responseData(result.rows[0]) });
} catch (e) { next(e); } });
app.get('/api/invitations/:code', async (req, res, next) => { try { const result = await pool.query('SELECT * FROM invitations WHERE id = $1', [req.params.code]); if (!result.rowCount) return res.status(404).json({ error:'Invitación no encontrada.' }); res.json(responseData(result.rows[0])); } catch (e) { next(e); } });
app.get('/api/invitations', async (_, res, next) => { try { const result = await pool.query('SELECT id, client_name, birthday, flight_date, sender, message, created_at FROM invitations ORDER BY created_at DESC'); res.json(result.rows.map(row => ({ code:row.id, ...responseData(row) }))); } catch (e) { next(e); } });
app.use((err, _, res, __) => { console.error(err); res.status(500).json({ error:'Ocurrió un error inesperado.' }); });
app.listen(port, () => console.log(`API Ecuador Parapente en puerto ${port}`));