import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true        //makes searching easy (optimized)
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, //cloudinary url
        required: true
    },
    coverImage: {
        type: String,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshTokens: {
        type: String
    }
},

    {
        timestamps: true
    })


//hooks -> pre

userSchema.pre('save', async function (next) {
    //we don't want each time hashing to happen , so write a condn
    if (!this.isModified("password")) {
        return next();
    }
    //if modified
    this.password = bcrypt.hash(this.password, 10);      //encrypt -> 10 rounds , salts , rounds , default 
    next()
})


//inject own method into mongoose  -> default (updateOne() ,deleteOne())

userSchema.methods.isPasswordCorrect = async function () {
    return await bcrypt.compare(password, this.password)   //this.password -> hashed password in db
}


//to generate access tokens

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

//refresh token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
export const User = mongoose.model('User', userSchema);