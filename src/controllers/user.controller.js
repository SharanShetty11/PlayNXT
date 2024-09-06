import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    //  res.status(200).json({
    //     message : "Chai aur Code"
    // })

    const { fullname, email, username, password } = req.body
    console.log("email ", email);

    // if(fullname == ""){     //beginners
    //     throw new ApiError(400,"fullname is required")
    // }

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //email validation
    function validateEmail(mail) {
        const regex = /^[a-zA-Z0-9]+@[a-z]+\.[a-z]+$/

        return regex.test(mail);
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, "Email is Valid");
    }

    //check for existing user

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    //handling images using multer allows us to include more parameters

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const converImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(converImageLocalPath);

    //check avatar again

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //Entry into db via User

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        converImage: coverImage?.url || "",    //if cI doesn't exist ""
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //weird syntax -> by default all fields are selected , - indicates not to included fields

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    //once the user has been created , produce response

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

    //we specify status separately -> standard also expected by postman

    

})

export { registerUser }