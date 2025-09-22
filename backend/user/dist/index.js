import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
dotenv.config();
const app = express();
const PORT = process.env.PORT;
console.log(PORT);
console.log(process.env.UPSTASH_REDIS_REST_TOKEN);
// connecting to the database.
connectDb();
// connect to remote redis client
// i am using upstash redis
export const redisClient = createClient({
    url: `rediss://default:${process.env.UPSTASH_REDIS_REST_TOKEN}@${process.env.UPSTASH_REDIS_REST_URL}:6379`,
});
redisClient.connect().then(() => {
    console.log("Connected to redis server.");
}).catch(console.error);
app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});
