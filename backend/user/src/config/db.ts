import mongoose from "mongoose";

const connectDb = async () => {
    const url = process.env.MONGO_URI;
    
    try {
        if(!url){
            throw new Error("url not found in env");
        }

        await mongoose.connect(url, {
            dbName: "RealTimeChatMicroservice"
        })

        console.log("Connected to mongo db");
    } catch (error) {
        console.log("Error connecting to the database: ", error);
    }
}

export default connectDb