import mongoose, { Schema } from "mongoose";
const MessageSchema = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    text: {
        type: String,
    },
    image: {
        url: String,
        publicId: String,
    },
    messageType: {
        type: String,
        enum: ["text", "image"],
        default: "text",
    },
    seen: {
        type: Boolean,
        default: false,
    },
    seenAt: {
        type: Date,
        default: null
    },
}, {
    timestamps: true,
});
export const Messages = mongoose.model("Messages", MessageSchema);
