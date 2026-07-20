// Gin-Katalog (Vertrag §5.2): Liste öffentlich, Bewerten nur eingeloggt.
import { Router } from 'express';
import { apiError } from '../middleware/errorEnvelope.js';
import { isValidRating, publicGin } from '../lib/domain.js';

export function createGinsRouter({ repo, auth, newId, now }) {
  const router = Router();

  // GET / -> öffentlich. auth.attachUser setzt req.user, ohne den Zugriff zu blockieren,
  // damit eingeloggte Nutzer:innen ihre eigene Bewertung markiert sehen.
  router.get('/', auth.attachUser, (req, res) => {
    const gins = repo.listGins();
    const summaries = repo.ratingSummaries();
    const ownRatings = req.user ? repo.userRatingsForUser(req.user.id) : {};

    res.json({ gins: gins.map((gin) => publicGin(gin, summaries[gin.id], ownRatings[gin.id])) });
  });

  // PUT /:id/rating {rating: 1..5} -> nur eingeloggt. Upsert: 1 Bewertung/Nutzer:in/Gin.
  router.put('/:id/rating', auth.requireAuth, (req, res) => {
    const gin = repo.getGinById(req.params.id);
    if (!gin) throw apiError('GIN_NOT_FOUND', 'Dieser Gin existiert nicht.');

    const rating = Number(req.body?.rating);
    if (!isValidRating(rating)) throw apiError('INVALID_RATING', 'Die Bewertung muss zwischen 1 und 5 liegen.');

    const timestamp = now();
    repo.upsertRating({
      id: newId(),
      ginId: gin.id,
      userId: req.user.id,
      rating,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const summaries = repo.ratingSummaries();
    res.json({ gin: publicGin(gin, summaries[gin.id], rating) });
  });

  return router;
}
