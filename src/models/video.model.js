import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
    videoFile: {
        type: String,  //cloudinary url
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    duration: {
        type: Number,  //compute from cloudinary
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    })

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);