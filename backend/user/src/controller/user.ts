import { Response } from "express";
import { generateToken } from "../config/generateToken.js";
import { PublishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { UserModel } from "../model/User.js";
import mongoose from "mongoose";

// SEND THE OTP
export const loginUser = TryCatch(async(req, res)=>{
    const {email} = req.body;

    // okay, so the context here is that i am setting a rate limit key every time i am 
    // sending an otp to the user in redis cache. So that, if the same user try to send the otp
    // back again before the expiry(1 min), he wont be able to do so. BAAAMMM :- RAATTEEE LIMIIITING
    const rateLimitKey = `otp:ratelimit:${email}`

    // if there already exists a rateLimitKey with the associated email, then user is trying to send
    // otp request before expiry. which is bad! So, if key already exists in redis, then send 
    // an error message
    const rateLimit = await redisClient.get(rateLimitKey);
    if(rateLimit){
        res.status(429).json({
            message: "Too many requests. Please wait before requesting new otp."
        })
        return;
    }


    // if the key doesn't exist, which means either user has sent the otp request for the first time
    // or he has requested the otp again after expiry (1 min)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // otpKey is different from rateLimitKey
    // here we are sending the otp.
    // otp goes to user's email
    // user seed the 6 digit otp with his bootiful eyes
    // user puts the otp in the boxes
    // BAAMMM:- then we can do redisClient.get(otpKey) to confirm that the otp sent is the valid one
    const otpKey = `otp:${email}`
    await redisClient.set(otpKey, otp, {
        EX: 300, // 60 * 5 := 5 minutes
    })

    // we store the rateLimitKey! then at the top of this function, we are checking if user is trying to 
    // request the otp before expiry or not
    await redisClient.set(rateLimitKey, "true", {
        EX:60, // 1 minute
    });

    // creating the message to send to the queue
    const message = {
        to: email, 
        subject: "Your otp code", 
        body: `Your otp is ${otp}. It is valid for 5 minutes`
    }

    // send to the queue with specific email
    await PublishToQueue("send-otp", message);

    return res.status(200).json({
        message: "OTP sent to your mail"
    })
})

// VERIFY THE ENTERED OTP
export const verifyUser = TryCatch(async(req, res)=>{
    const {email, otp:enteredOtp} = req.body
    if(!email || !enteredOtp){
        res.status(400).json({
            message:"Email and OTP required",
        });
        return;
    }

    // otpKey same as that which is used while login.
    // Therefore, i can fetch the SERVER SENT OTP from redis client
    // and compare with the entered otp.
    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    if(!storedOtp || storedOtp!=enteredOtp){
        res.status(400).json({
            message: "Invalid or expired OTP",
        })
        return;
    }

    // if the otp matches, then delete the otp.
    await redisClient.del(otpKey);

    // if the user doesn't exist, then create one.
    let user = await UserModel.findOne({email});
    if(!user){
        const name = email.slice(0, 8);
        user = await UserModel.create({name, email});
    }

    const token = generateToken(user);
    return res.json({
        message:"User verified!",
        user, 
        token,
    })

})

// fetch my profile
// this will be called after middleware, so the res.body changes along the way
// in the auth middleware, req.user becomes the actual jwt decoded user
export const myProfile = TryCatch(async(req: AuthenticatedRequest, res: Response) =>{
    const user = req.user
    res.json(user)
})


//Controller to update the name of the user
export const updateName = TryCatch(async(req: AuthenticatedRequest, res:Response)=>{
    const user = await UserModel.findById(req.user?._id)

    if(!user){
        res.status(404).json({
            message: "Please login",
        })
        return;
    }

    user.name = req.body.name;
    await user.save();
    const token = generateToken(user);
    res.json({
        message: "User updated", 
        user, 
        token,
    })
})

export const getAllUsers = TryCatch(async(req: AuthenticatedRequest, res: Response)=>{
    const users = await UserModel.find();
    res.json({
        users
    })
})

export const getUser = TryCatch(async(req:AuthenticatedRequest, res: Response)=>{

    const userId = req.params.id
    console.log(userId)
    if(!userId){
        res.status(404).json({
            message:"userId not provided"
        })
        return;
    }

    // first validate if the provided id is a valid Mongoose Object Id
    if(!mongoose.Types.ObjectId.isValid(userId)){
        res.status(404).json({
            message: "Invalid UserId"
        })
        return;
    }
    const user = await UserModel.findById(userId);
    if(!user){
        res.status(404).json({
            message: "User not found",
        })
        return;
    }

    res.json({
        user
    })
})