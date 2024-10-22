import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose"


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
        throw new ApiError(500, "Something went wrong while generating refresh and access token ", err);
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
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))

});


//refresh Access Token using refresh Token

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);    //will have _id of user

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or Used")
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user?.id);

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, {
                    accessToken, refreshToken: newRefreshToken
                }, "Access Token Refreshed ")
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;


    // const user = req.user;      //from 'auth' middleware
    const user = await User.findById(req.user?._id);

    const isPassCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPassCorrect) {
        throw new ApiError(400, "Entered password is incorrect")
    }


    user.password = newPassword;    //pre hook is executed
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"))
});


const getCurrentUser = asyncHandler(async (req, res) => {
    //via auth middleware
    return res.status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"));
})

//to update other fields of user

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                //fullName : fullName,
                fullName,
                email: email
            }
        },
        { new: true }    //new updated user will be returned
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Deatails Updated Successfully"))
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    console.log(req.file);

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // Find the user by ID
    const userAvatar = await User.findById(req.user?._id).select('avatar');

    // Delete the existing avatar from Cloudinary if it exists
    const publicId = userAvatar.avatar?.split('/').pop().split('.')[0]; // Extract public ID from the URL
    await deleteImageFromCloudinary(publicId); // Use the utility function


    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const userCoverImage = await User.findById(req.user?._id).select('coverImage');

    // Delete the existing avatar from Cloudinary if it exists
    const publicId = userCoverImage.coverImage?.split('/').pop().split('.')[0];
    await deleteImageFromCloudinary(publicId);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage Updated Successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([  //first channel to get subscribers of a channel
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }

            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedTo: 1,
                isSubscribed: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                converImage: 1,
                email: 1

            }
        }

    ])

    console.log(channel)

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",           //now we have all the documents (videos)
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",        //here we get an array
                            pipeline: [         //apply 
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {               //override
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },

    ])

        console.log("No Watch History")
    

    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"));
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,

    getUserChannelProfile,
    getWatchHistory
}