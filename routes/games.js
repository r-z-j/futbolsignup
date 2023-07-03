const express = require("express");
const router = express.Router();
const ExpressError = require("../utils/ExpressError");
const catchAsync = require("../utils/catchAsync");
const { gameSchema } = require("../schemas");
const { isLoggedIn, isAdmin } = require("../middleware");
const Game = require("../models/game");
const User = require("../models/user");

const validateGame = (req, res, next) => {
    const { error } = gameSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

router.get(
    "/",
    catchAsync(async (req, res) => {
        const games = await Game.find({})
            .populate("players")
            .populate("waitlist")
            .exec();
        res.render("games/index", { games });
    })
);

router.get("/new", isLoggedIn, isAdmin, (req, res) => {
    res.render("games/new");
});

router.post(
    "/",
    isLoggedIn,
    validateGame,
    catchAsync(async (req, res) => {
        const game = new Game(req.body.game);
        await game.save();
        req.flash("success", "Successfully made a new game");
        res.redirect(`/games/${game._id}`);
    })
);

router.get(
    "/:id",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { username, email, role } = req.user;
        const game = await Game.findById(req.params.id).populate("players");
        if (!game) {
            req.flash("error", "Cannot find game");
            return res.redirect("/games");
        }
        res.render("games/show", { game, username, email, role });
    })
);

router.get(
    "/:id/edit",
    isLoggedIn,
    isAdmin,
    catchAsync(async (req, res) => {
        const game = await Game.findById(req.params.id).populate("players");
        if (!game) {
            req.flash("error", "Cannot find game");
            return res.redirect("/games");
        }
        res.render("games/edit", { game });
    })
);

router.put(
    "/:id",
    isLoggedIn,
    validateGame,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const game = await Game.findByIdAndUpdate(id, { ...req.body.game });
        req.flash("success", "Successfully updated game");
        res.redirect(`/games/${game._id}`);
    })
);

router.delete(
    "/:id",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        await Game.findByIdAndDelete(id);
        res.redirect("/games");
    })
);

router.post(
    "/:id/remove",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const game = await Game.findById(id).populate("players").exec();
        const user = await User.findById(req.user._id);
        let contains = game.players.some((elem) => {
            return JSON.stringify(user._id) === JSON.stringify(elem._id);
        });
        if (contains) {
            await game.players.pop(user);
            await game.save();
            req.flash("success", "Removed from game");
            res.redirect(`/games/${game._id}`);
        } else {
            game.players.push(user);
            await game.save();
        }
        req.flash("success", "Successfully signed up for game");
        res.redirect(`/games/${game._id}`);
    })
);

router.post(
    "/:id/signup",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const game = await Game.findById(id).populate("players").exec();
        const user = await User.findById(req.user._id);
        let contains = game.players.some((elem) => {
            return JSON.stringify(user._id) === JSON.stringify(elem._id);
        });
        if (contains) {
            req.flash("error", "Already signed up for this game");
            res.redirect(`/games/${game._id}`);
        } else {
            game.players.push(user);
            await game.save();
        }
        req.flash("success", "Successfully signed up for game");
        res.redirect(`/games/${game._id}`);
    })
);

module.exports = router;
