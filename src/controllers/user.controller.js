import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //save to db -> avoide entering password again and again

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    }
    catch (err) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token ",err);
    }
}


const registerUser = asyncHandler(async (req, res) => {
    //  res.status(200).json({
    //     message : "Chai aur Code"
    // })

    // console.log(req.files); // Log the uploaded files

    const { fullName, email, username, password } = req.body
    // console.log("email ", email);

    // if(fullname == ""){     //beginners
    //     throw new ApiError(400,"fullname is required")
    // }

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //email validation
    function validateEmail(mail) {
        const regex = /^[a-zA-Z0-9]+@[a-z]+\.[a-z]+$/

        return regex.test(mail);
    }

    if (!validateEmail(email)) {
        throw new ApiError(405, "Email is Not Valid");
    }

    //check for existing user

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log("req.body \n", req.body);


    //handling images using multer allows us to include more parameters

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // console.log("Avatar upload response:", avatar); // Log Cloudinary response for avatar

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //check avatar again
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //Entry into db via User

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",    //if cI doesn't exist ""
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //weird syntax -> by default all fields are selected , - indicates not to included fields

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //once the user has been created , produce response
    console.log(`201, user with username ${username} has been created Successfully`)
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

    //we specify status separately -> standard also expected by postman



});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPassValid = user.isPasswordCorrect(password);

    if (!isPassValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    //generate access and refresh token

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id); //might take time

    //cookies

    //can take user reference again as 'user' will not have access to accessToken

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User Logged In Successfully")
        )

});

const logoutUser = asyncHandler(async (req, res) => {
    //after executing auth-middleware we can use req.user 

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from document 
            }

        },
        {
            new: true      //ensure that updated state of db is returned -> otherwise old state with refreshToken returned
        }

    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
    

});


export {
    registerUser,
    loginUser,
    logoutUser
}