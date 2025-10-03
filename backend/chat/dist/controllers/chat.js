import TryCatch from "../config/TryCatch.js";
import { Chat } from "../models/chat.js";
import { Messages } from "../models/Message.js";
import axios from "axios";
export const createNewChat = TryCatch(async (req, res) => {
    const userId = req.user?._id;
    // console.log("user" ,req.user);
    console.log("request: ", req.body);
    const { otherUserId } = req.body;
    console.log("other guy's id: ", otherUserId);
    if (!otherUserId) {
        res.status(400).json({
            message: "Other userid is required"
        });
        return;
    }
    const existingChat = await Chat.findOne({
        users: { $all: [userId, otherUserId], $size: 2 }
    });
    if (existingChat) {
        res.json(({
            message: "Chat already exists",
            chatId: existingChat._id,
        }));
        return;
    }
    const newChat = await Chat.create({
        users: [userId, otherUserId],
    });
    res.status(201).json({
        message: "New Chat created!",
        chatId: newChat._id
    });
});
// this is to display the chats information of all people i have messaged on frontend
export const getAllChats = TryCatch(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        res.status(400).json({
            message: "user id missing",
        });
        return;
    }
    // find all the chats i have with recent updated chats on top
    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });
    // so when the user is typing, i want to show "username typing" on topbar.
    const chatWithUserData = await Promise.all(chats.map(async (chat) => {
        const otherUserId = chat.users.find(id => id !== userId);
        // count the number of unseen messages
        const unseenCount = await Messages.countDocuments({
            chatId: chat._id,
            sender: { $ne: userId }, // $ne => not equal to userId to ensure the otherUserId is the sender
            seen: false
        });
        try {
            const { data } = await axios.get(
            // "http://localhost:5000/api/v1/get-user/68d75fca0544576bc7bc0a86"
            `${process.env.USER_SERVICE}/api/v1/get-user/${otherUserId}`);
            return {
                user: data,
                chat: {
                    ...chat.toObject(),
                    latestMessage: chat.latestMessage || null,
                    unseenCount,
                }
            };
        }
        catch (error) {
            console.log(error);
            return {
                user: { _id: otherUserId, name: "Unknown User" },
                chat: {
                    ...chat.toObject(),
                    latestMessage: chat.latestMessage || null,
                    unseenCount,
                }
            };
        }
    }));
    res.json({
        chats: chatWithUserData
    });
});
export const sendMessage = TryCatch(async (req, res) => {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;
    if (!senderId) {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }
    if (!chatId) {
        res.status(400).json({
            mesage: "ChatId Required"
        });
        return;
    }
    if (!text && !imageFile) {
        res.status(400).json({
            message: "Either text or image is required"
        });
        return;
    }
    // find if the chat with chatId exist or not
    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404).json({
            message: "Chat not found!"
        });
        return;
    }
    // at first, i am going to check if the chat with chatId has a valid sender or not.
    // like if any other person is trying to access any other chat and that user is not a participant,
    // then i need to restrict that user from accessing that chat
    const isUserInChat = chat.users.some((userId) => userId.toString() === senderId.toString());
    if (!isUserInChat) {
        res.status(403).json({
            message: "You cannot send messages in this chat!"
        });
        return;
    }
    // to send the message to the other user, i should know the id of the receiver as well.
    // so in the array there are only 2 participants -> sender and receiver
    // receiver id -> id which is not sender id!
    const otherUserId = chat.users.find((userId) => userId.toString() !== senderId.toString());
    if (!otherUserId) {
        res.status(401).json({
            message: "No other user",
        });
        return;
    }
    // TODO:socket setup
    let messageData = {
        chatId: chatId,
        sender: senderId,
        seen: false,
        seenAt: undefined,
    };
    if (imageFile) {
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename
        };
        messageData.messageType = "image";
        messageData.text = text || "";
    }
    else {
        messageData.text = text;
        messageData.messageType = "text";
    }
    const message = new Messages(messageData);
    const savedMessage = await message.save();
    const latestMessageText = imageFile ? "📷 image" : text;
    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            text: latestMessageText,
            sender: senderId,
        },
        updatedAt: new Date()
    }, { new: true });
    // emit to sockets
    res.status(201).json({
        message: savedMessage,
        sender: senderId,
    });
});
