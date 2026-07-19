'use strict';

const express = require('express');
const { newId } = require('../lib/ids');
const { nowIso } = require('../lib/time');
const { requireAuth } = require('../middleware/auth');
const { HttpError } = require('../middleware/errorEnvelope');
const { isValidRating } = require('../lib/domain');

function toGinDto(row, summary, ownRating) {
    return {
        id: row.id,
        name: row.name,
        image: row.image,
        region: row.region,
        taste: row.taste,
        alcohol: row.alcohol,
        cost: row.cost,
        category: row.category,
        botanicals: row.botanicals,
        story: row.story,
        perfectServe: row.perfect_serve,
        averageRating: summary ? summary.averageRating : 0,
        ratingCount: summary ? summary.ratingCount : 0,
        ownRating: ownRating ?? null,
    };
}

function createGinsRouter(repo) {
    const router = express.Router();

    router.use(requireAuth);

    router.get('/', (req, res) => {
        const gins = repo.listGins();
        const summaries = repo.ratingSummaries();
        const ownRatings = repo.userRatingsForUser(req.user.id);

        res.json(gins.map((gin) => toGinDto(gin, summaries[gin.id], ownRatings[gin.id])));
    });

    router.put('/:id/rating', (req, res) => {
        const gin = repo.findGinById(req.params.id);
        if (!gin) {
            throw new HttpError(404, 'GIN_NOT_FOUND', 'Dieser Gin existiert nicht.');
        }

        const rating = Number(req.body.rating);
        if (!isValidRating(rating)) {
            throw new HttpError(400, 'INVALID_RATING', 'Die Bewertung muss zwischen 1 und 5 liegen.');
        }

        const timestamp = nowIso();
        repo.upsertRating({
            id: newId(),
            ginId: gin.id,
            userId: req.user.id,
            rating,
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        res.json({ ok: true });
    });

    return router;
}

module.exports = { createGinsRouter, toGinDto };
