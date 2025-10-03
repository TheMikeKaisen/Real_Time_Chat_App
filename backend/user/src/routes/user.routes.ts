import express from "express";
import { getAllUsers, getUser, loginUser, myProfile, updateName, verifyUser } from "../controller/user.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.get("/me", isAuth, myProfile);
router.get("/get-all-users", isAuth, getAllUsers)

// getting a particular user is not middleware protected 
// because i will only be using this url to fetch data from other backend service only
// and not frontend
router.get("/get-user/:id", getUser)
router.get("/update-username", isAuth, updateName)


export default router;