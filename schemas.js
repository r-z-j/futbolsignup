const Joi = require("joi");

module.exports.gameSchema = Joi.object({
    game: Joi.object({
        gameDate: Joi.date().required(),
        gameTime: Joi.string(),
        description: Joi.string().allow(null, "").max(512),
    }).required(),
});
