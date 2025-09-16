import mongoose, {Document, model, Schema} from "mongoose";

export interface IUser extends Document{
    name:string;
    email:string
}

const UserSchema:Schema<IUser> = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String, 
        required:true
    }
})

export const UserModel = model("User", UserSchema);
