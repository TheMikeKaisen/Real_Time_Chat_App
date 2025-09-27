import jwt from "jsonwebtoken";
export const isAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(400).json({
                message: "Please Login - No Auth Header"
            });
            return;
        }
        const authToken = authHeader.split(" ")[1];
        if (!authToken) {
            throw Error("Token not found!");
        }
        const jwt_secret = process.env.JWT_SECRET;
        if (!jwt_secret) {
            throw Error("could not get jwt secret");
        }
        const decodedValue = jwt.verify(authToken, jwt_secret);
        if (!decodedValue || !decodedValue.user) {
            res.status(401).json({
                message: "Invalid token"
            });
            return;
        }
        req.user = decodedValue.user;
        // make req.user to be the decoded body of the user
        // calling the next function
        next();
    }
    catch (error) {
        res.status(401).json({
            message: "Please Login - JWT Error!"
        });
    }
};
