import multer from "multer";

const storage = multer.diskStorage({
    destination : function (req,file, cb){
        cb(null , "./public/temp")          //all files in public folder , easy access
    },
    filename : function (req, file, cb){
        cb(null , file.originalname)
    }
});

export const upload = multer({
    storage
})

//when we write routes , controllers ; we call our storage method 