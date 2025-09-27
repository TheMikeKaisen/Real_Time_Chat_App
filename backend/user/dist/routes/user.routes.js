import express from "express";
import { loginUser, myProfile, verifyUser } from "../controller/user.js";
import { isAuth } from "../middlewares/isAuth.js";
const router = express.Router();
router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.get("/me", isAuth, myProfile);
export default router;
