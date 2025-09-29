import type { Response } from "express";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/chat.js";



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