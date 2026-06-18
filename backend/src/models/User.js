import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clorkID: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    profilePicture: {
        type: String,
        default: "",// Default profile picture
    },
    bio: {
        type: String,
        default: "",// Default bio
    },
    location: {
        type: String,
        default: "",// Default location
    },
    website: {
        type: String,
        default: "",// Default website
    },
    followers: {
        type: [String],
        default: [],// Default followers
    },
    following: {
        type: [String],
        default: [],// Default following
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;