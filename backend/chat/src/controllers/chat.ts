import type { Response } from "express";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/chat.js";
import { Messages } from "../models/Message.js";
import axios from "axios";



export const createNewChat = TryCatch(async(req:AuthenticatedRequest, res: Response)=>{
    const userId = req.user?._id;
    // console.log("user" ,req.user);
    console.log("request: ", req.body);

    const {otherUserId} = req.body;
    console.log("other guy's id: ", otherUserId)

    if(!otherUserId){
        res.status(400).json({
            message:"Other userid is required"
        })
        return;
    }

    const existingChat = await Chat.findOne({
        users:{$all:[userId, otherUserId], $size:2}
    })

    if(existingChat){
        res.json(({
            message: "Chat already exists",
            chatId: existingChat._id,
        }))
        return;
    }

    const newChat = await Chat.create({
        users: [userId, otherUserId],
    })

    res.status(201).json({
        message:"New Chat created!",
        chatId: newChat._id
    })

})

// this is to display the chats information of all people i have messaged on frontend
export const getAllChats= TryCatch(async(req:AuthenticatedRequest, res) =>{
    const userId = req.user?._id;
    if(!userId){
        res.status(400).json({
            message: "user id missing",
        })
        return;
    }

    // find all the chats i have with recent updated chats on top
    const chats = await Chat.find({users: userId}).sort({updatedAt: -1});

    // so when the user is typing, i want to show "username typing" on topbar.
    const chatWithUserData = await Promise.all(
        chats.map(async(chat)=>{
            const otherUserId = chat.users.find(id => id!==userId);

            // count the number of unseen messages
            const unseenCount = await Messages.countDocuments({
                chatId: chat._id,
                sender: {$ne: userId}, // $ne => not equal to userId to ensure the otherUserId is the sender
                seen: false
            })

            try {
                const {data} = await axios.get(
                    // "http://localhost:5000/api/v1/get-user/68d75fca0544576bc7bc0a86"
                    `${process.env.USER_SERVICE}/api/v1/get-user/${otherUserId}`
                )

                return {
                    user: data,
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                }
            } catch (error) {
                console.log(error);
                return {
                    user: {_id: otherUserId, name: "Unknown User"},
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                }
            }
        })
    )

    res.json({
        chats: chatWithUserData
    })

})