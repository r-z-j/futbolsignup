const express = require("express");
const router = express.Router();
const ExpressError = require("../utils/ExpressError");
const catchAsync = require("../utils/catchAsync");
const { gameSchema } = require("../schemas");
const { isLoggedIn, isAdmin } = require("../middleware");
const nodemailer = require("nodemailer");
const Game = require("../models/game");
const User = require("../models/user");
const emailPassword = process.env.EMAIL_PASS;

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
        games.sort(function (a, b) {
            return a.gameDate.getTime() - b.gameDate.getTime();
        });
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
        const game = await Game.findByIdAndDelete(id).populate("players");
        for (let user of game.players) {
            let j = user.activeGames.findIndex(
                (object) =>
                    JSON.stringify(object._id) === JSON.stringify(game._id)
            );
            user.activeGames.splice(j, 1);
            await user.save();
        }

        res.redirect("/games");
    })
);

router.post(
    "/:id/remove",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const game = await Game.findById(id).populate("players");
        const user = await User.findById(req.user._id);
        let playersIndex = game.players.findIndex(
            (object) => JSON.stringify(object._id) === JSON.stringify(user._id)
        );
        let gamesIndex = user.activeGames.findIndex(
            (object) => JSON.stringify(object._id) === JSON.stringify(game._id)
        );

        if (playersIndex >= 0) {
            game.players.splice(playersIndex, 1);
            user.activeGames.splice(gamesIndex, 1);
            await user.save();
            await game.save();
        }
        res.redirect(`/games/${game._id}`);
    })
);

router.post(
    "/:id/signup",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const game = await Game.findById(id).populate("players");
        const user = await User.findById(req.user._id);
        let contains = game.players.some((elem) => {
            return JSON.stringify(user._id) === JSON.stringify(elem._id);
        });
        if (contains) {
            req.flash("error", "Already signed up for this game");
            res.redirect(`/games/${game._id}`);
        } else if (!user.verified) {
            req.flash("error", "User is not verified");
            res.redirect(`/games/${game._id}`);
        } else {
            await game.players.push(user);
            await game.save();
            await user.activeGames.push(game);
            await user.save();
            res.redirect(`/games/${game._id}`);
        }
    })
);

router.post(
    "/email/:id",
    isAdmin,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const game = await Game.findById(id).populate("players");
        const { message } = req.body;

        for (player of game.players) {
            const transporter = nodemailer.createTransport({
                service: "fastmail",
                auth: {
                    user: "futbolsignup@sent.com",
                    pass: emailPassword,
                },
            });

            let mailOptions = {
                from: "futbolsignup@sent.com",
                to: player.email,
                subject: "Teams",
                text: message,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    req.flash("error", "Error sending email");
                    console.log(error);
                } else {
                    req.flash("success", "Emails sent!");
                    console.log("Email sent: " + info.response);
                }
            });
        }
        res.redirect(`/games/${game._id}`);
    })
);

module.exports = router;
