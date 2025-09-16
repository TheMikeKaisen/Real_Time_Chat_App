import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT;
// connecting to the database.
connectDb();
app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});
