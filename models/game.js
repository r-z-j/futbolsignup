const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    gameDate: Date,
    gameTime: String,
    description: String,
    players: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    waitlist: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
});

GameSchema.post("findOneAndDelete", async function () {
    // DELETE and lingering data on game
});

module.exports = mongoose.model("Game", GameSchema);
