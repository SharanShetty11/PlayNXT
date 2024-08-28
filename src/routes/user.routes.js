import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

//when a req comes to '/register' call method registerUser
router.route("/register").post(registerUser);

export default router;