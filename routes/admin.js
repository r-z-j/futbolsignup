const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAdmin } = require("../middleware");
const nodemailer = require("nodemailer");
const Game = require("../models/game");
const User = require("../models/user");

router.get(
	"/",
	isLoggedIn,
	isAdmin,
	catchAsync(async (req, res) => {
        const games = await Game.find({})
            .populate("players")
            .exec();
		const users = await User.find({}).exec();
        games.sort(function (a, b) {
            return a.gameDate.getTime() - b.gameDate.getTime();
        });
		res.render("admin/index", { games, users } );
	})
);

// Route to handle verification status toggle
router.post('/verify-user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const newVerifiedStatus = req.body.verified === 'true'; // Convert from string to boolean

        // Find user by ID and update verified status
        await User.findByIdAndUpdate(userId, { verified: newVerifiedStatus });

        // Redirect back to the same page
        res.redirect('/admin'); // Adjust URL to the admin page
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
// Export the router
module.exports = router;


