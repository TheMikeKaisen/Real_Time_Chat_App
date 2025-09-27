import { PublishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { UserModel } from "../model/User.js";
// SEND THE OTP
export const loginUser = TryCatch(async (req, res) => {
    const { email } = req.body;
    // okay, so the context here is that i am setting a rate limit key every time i am 
    // sending an otp to the user in redis cache. So that, if the same user try to send the otp
    // back again before the expiry(1 min), he wont be able to do so. BAAAMMM :- RAATTEEE LIMIIITING
    const rateLimitKey = `otp:ratelimit:${email}`;
    // if there already exists a rateLimitKey with the associated email, then user is trying to send
    // otp request before expiry. which is bad! So, if key already exists in redis, then send 
    // an error message
    const rateLimit = await redisClient.get(rateLimitKey);
    if (rateLimit) {
        res.status(429).json({
            message: "Too many requests. Please wait before requesting new otp."
        });
        return;
    }
    // if the key doesn't exist, which means either user has sent the otp request for the first time
    // or he has requested the otp again after expiry (1 min)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // otpKey is different from rateLimitKey
    // here we are sending the otp.
    // otp goes to user's email
    // user seed the 6 digit otp with his bootiful eyes
    // user puts the otp in the boxes
    // BAAMMM:- then we can do redisClient.get(otpKey) to confirm that the otp sent is the valid one
    const otpKey = `otp:${email}`;
    await redisClient.set(otpKey, otp, {
        EX: 300, // 60 * 5 := 5 minutes
    });
    // we store the rateLimitKey! then at the top of this function, we are checking if user is trying to 
    // request the otp before expiry or not
    await redisClient.set(rateLimitKey, "true", {
        EX: 60, // 1 minute
    });
    // creating the message to send to the queue
    const message = {
        to: email,
        subject: "Your otp code",
        body: `Your otp is ${otp}. It is valid for 5 minutes`
    };
    // send to the queue with specific email
    await PublishToQueue("send-otp", message);
    return res.status(200).json({
        message: "OTP sent to your mail"
    });
});
// VERIFY THE ENTERED OTP
export const verifyUser = TryCatch(async (req, res) => {
    const { email, otp: enteredOtp } = req.body;
    if (!email || !enteredOtp) {
        res.status(400).json({
            message: "Email and OTP required",
        });
        return;
    }
    // otpKey same as that which is used while login.
    // Therefore, i can fetch the SERVER SENT OTP from redis client
    // and compare with the entered otp.
    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp || storedOtp != enteredOtp) {
        res.status(400).json({
            message: "Invalid or expired OTP",
        });
        return;
    }
    // if the otp matches, then delete the otp.
    await redisClient.del(otpKey);
    // if the user doesn't exist, then create one.
    let user = await UserModel.findOne({ email });
    if (!user) {
        const name = email.slice(0, 8);
        user = await UserModel.create({ name, email });
    }
});
