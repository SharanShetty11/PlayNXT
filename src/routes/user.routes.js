import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

//when a req comes to '/register' call method registerUser
router.route("/register").post(
    //inject middleware
    upload.fields(
        //accept 2 files -> avatar , cover image -> 2 objects
        [
            {
                name : "avatar",
                maxCount : 1
            },
            {
                name : "coverImage",
                maxCount : 1
            }
        ]
    ),
    registerUser
);

router.route("/login").post(loginUser)

//secured routes (only if logged in)

router.route("/logout").post(verifyJWT, logoutUser)

export default router;