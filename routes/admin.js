// Admin-Verwaltung (nur is_admin): Gin-CRUD + Nutzerverwaltung.
import { Router } from 'express';
import { apiError } from '../middleware/errorEnvelope.js';
import { validateGinPayload, publicGin, publicAdminUser } from '../lib/domain.js';

function readGinPayload(body) {
  const result = validateGinPayload(body);
  if (!result.valid) throw apiError('VALIDATION', `Feld "${result.field}" ist ungültig.`);
  return result.gin;
}

export function createAdminRouter({ repo, auth, newId, now }) {
  const router = Router();
  router.use(auth.requireAdmin);

  // -- Gins --

  // Anders als der öffentliche Katalog (routes/gins.js) liefert diese Route ALLE
  // Gins, auch ausverkaufte/unsichtbare — sonst könnte die Admin-Oberfläche sie
  // nicht wieder einblenden.
  router.get('/gins', (req, res) => {
    const summaries = repo.ratingSummaries();
    res.json({ gins: repo.listGins().map((gin) => publicGin(gin, summaries[gin.id], null)) });
  });

  router.post('/gins', (req, res) => {
    const payload = readGinPayload(req.body);
    if (repo.getGinByName(payload.name)) throw apiError('GIN_EXISTS', 'Ein Gin mit diesem Namen existiert bereits.');

    const timestamp = now();
    const gin = repo.createGin({ id: newId(), ...payload, createdAt: timestamp, updatedAt: timestamp });
    res.status(201).json({ gin: publicGin(gin, null, null) });
  });

  router.put('/gins/:id', (req, res) => {
    const existing = repo.getGinById(req.params.id);
    if (!existing) throw apiError('GIN_NOT_FOUND', 'Dieser Gin existiert nicht.');

    const payload = readGinPayload(req.body);
    const duplicate = repo.getGinByName(payload.name);
    if (duplicate && duplicate.id !== existing.id) {
      throw apiError('GIN_EXISTS', 'Ein Gin mit diesem Namen existiert bereits.');
    }

    const gin = repo.updateGin(existing.id, { ...payload, updatedAt: now() });
    const summaries = repo.ratingSummaries();
    res.json({ gin: publicGin(gin, summaries[gin.id], null) });
  });

  router.delete('/gins/:id', (req, res) => {
    const existing = repo.getGinById(req.params.id);
    if (!existing) throw apiError('GIN_NOT_FOUND', 'Dieser Gin existiert nicht.');
    repo.deleteGin(existing.id);
    res.status(204).end();
  });

  // -- Users --

  router.get('/users', (req, res) => {
    res.json({ users: repo.listUsers().map(publicAdminUser) });
  });

  router.delete('/users/:id', (req, res) => {
    if (req.params.id === req.user.id) throw apiError('CANNOT_DELETE_SELF', 'Du kannst dich nicht selbst löschen.');
    const existing = repo.getUserById(req.params.id);
    if (!existing) throw apiError('USER_NOT_FOUND', 'Dieser Nutzer existiert nicht.');
    repo.deleteUser(existing.id);
    res.status(204).end();
  });

  return router;
}
