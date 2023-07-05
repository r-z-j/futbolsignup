const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const Game = require("../models/game");
const User = require("../models/user");
const { storeReturnTo, isLoggedIn } = require("../middleware");

router.get("/register", (req, res) => {
    res.render("users/register");
});

router.post(
    "/register",
    catchAsync(async (req, res) => {
        try {
            const { email, username, password } = req.body;
            const user = new User({ email, username });
            const registeredUser = await User.register(user, password);
            req.login(registeredUser, (err) => {
                if (err) return next(err);
                req.flash("success", "Welcome");
                res.redirect("/games");
            });
        } catch (e) {
            req.flash("error", e.message);
            res.redirect("register");
        }
    })
);

router.get("/login", (req, res) => {
    res.render("users/login");
});

router.get(
    "/profile/:id",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const user = await User.findById(req.params.id).populate("activeGames");

        const userGames = await user.activeGames;

        let games = [];
        for (let i = 0; i < userGames.length; i++) {
            let g = await Game.findById(userGames[i]);
            if (g === null) {
                user.activeGames.splice(i, 1);
                await user.save();
            }
            games.push(g);
        }
        games.sort(function (a, b) {
            return a.gameDate.getTime() - b.gameDate.getTime();
        });
        res.render("users/show", { user, games });
    })
);

router.get(
    "/profile/:id/edit",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "Cannot find user");
            return res.redirect("/games");
        }
        res.render("users/edit", { user });
    })
);

router.put(
    "/profile/:id",
    isLoggedIn,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        try {
            const { email, username, password, confirmPassword } = req.body;
            const user = await User.findByIdAndUpdate(id, { email, username });
            if (password && confirmPassword) {
                if (password != confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const u = await User.findById(id);
                u.setPassword(password, function () {
                    u.save();
                });
            }
            user.save();
            res.redirect(`/profile/${user._id}`);
        } catch (e) {
            if (e.codeName === "DuplicateKey") {
                req.flash("error", `username ${e.keyValue.username} is taken`);
            } else {
                req.flash("error", e.message);
            }

            res.redirect(`/profile/${id}`);
        }
    })
);

router.post(
    "/login",
    storeReturnTo,
    passport.authenticate("local", {
        failureFlash: true,
        failureRedirect: "/login",
    }),
    (req, res) => {
        req.flash("success", "Welcome back!");
        const redirectUrl = res.locals.returnTo || "/games";
        res.redirect(redirectUrl);
    }
);

router.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash("success", "Goodbye!");
        res.redirect("/games");
    });
});

module.exports = router;
