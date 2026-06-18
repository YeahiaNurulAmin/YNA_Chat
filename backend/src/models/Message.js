import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
senderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
},
receiverID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
},
text: {
    type: String,
},
image: {
    type: String,
},
voice: {
    type: String,
},
video: {
    type: String,
},
audio: {
    type: String,
},
document: {
    type: String,
},
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;