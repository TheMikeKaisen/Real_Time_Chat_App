import express, { urlencoded } from "express"
import dotenv from "dotenv"
import connectDb from "./config/db.js";
import chatRouter from "./routes/chat.routes.js"

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({extended:true}))

connectDb();

app.use("/api/v1/chat", chatRouter);

const port = process.env.PORT;
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})

