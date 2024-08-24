//2 methods using promise and try-catch , we use promise


const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export { asyncHandler }














//higher orde function -- returns or accepts(as parameter) functions

// const asyncHandler = () => {}
// const asyncHandler = (func) =>{ () => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// const asyncHandler = (fn) => async (req, res , next) => {
//     try{
//         await fn(req,res,next)
//     }

//     catch(error){
//         res.status(error.code || 500).json({
//             success : flag, // success flag for the benefit of frontend
//             message : error.message
//         })
//     }
// }