import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router;