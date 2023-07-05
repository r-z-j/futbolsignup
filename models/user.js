const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },

    role: {
        type: String,
        enum: ["user", "manager", "admin"],
        default: "user",
    },
    activeGames: [
        {
            game: {
                type: Schema.Types.ObjectId,
                ref: "Game",
            },
        },
    ],
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
