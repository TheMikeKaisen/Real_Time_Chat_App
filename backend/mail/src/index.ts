import express from "express"
import dotenv from "dotenv"
import { startOtpConsumer } from "./consumer.js";

const app = express();

dotenv.config();

startOtpConsumer();

app.listen(process.env.PORT, ()=>{
    console.log(`Server running on PORT: ${process.env.PORT}`)
})
