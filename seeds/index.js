const mongoose = require("mongoose");
const Game = require("../models/game");
const User = require("../models/user");

mongoose.connect("mongodb://127.0.0.1:27017/bfb", {
    useNewUrlParser: true,
    // useCreateIndex: true, // not supported
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection eror:"));
db.once("open", () => {
    console.log("Database connected from seed generator");
});

const seedDB = async () => {
    await Game.deleteMany({});
    let d = Date.now();
    for (let i = 1; i <= 20; i++) {
        const g = new Game({
            description: "Bloomington, IN",
            gameDate: d + i * 86400000,
            gameTime: "8:30",
            players: [],
            waitlist: [],
        });
        await g.save();
    }
    try {
        const admin = new User({
            email: "admin@a.com",
            username: "admin",
            role: "admin",
        });
        const registeredUser = await User.register(admin, "admin");
        console.log(registeredUser);
    } catch (e) {
        console.log(e);
    }
};

seedDB();
