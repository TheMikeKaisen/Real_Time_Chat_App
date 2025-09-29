import type { NextFunction, Request, Response } from "express";
import type { Document } from "mongoose";
import jwt, { type JwtPayload } from "jsonwebtoken";

interface IUser extends Document{
    _id: string,
    name: string,
    email: string,
}


export interface AuthenticatedRequest extends Request{
    user?: IUser | null;

}

const isAuth = async(req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Please Login - No Auth header"
            })
            return;
        }const authToken  = authHeader.split(" ")[1];
        if(!authToken){
            throw Error("Token not found!");
        }

        const jwt_secret = process.env.JWT_SECRET as string;
        if(!jwt_secret){
            throw Error("could not get jwt secret");
        }
        const decodedValue = jwt.verify(authToken!, jwt_secret!) as JwtPayload;
        if(!decodedValue || !decodedValue.user){
            res.status(401).json({
                message: "Invalid token"
            })
            return;
        }
        req.user = decodedValue.user;

        // make req.user to be the decoded body of the user
        // calling the next function
        next();
    } catch (error) {
        res.status(401).json({
            message:"Please Login - JWT Error!"
        })
    }
}

export default isAuth;