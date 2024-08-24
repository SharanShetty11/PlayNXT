class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        errors = [],
        stack = ""      //error stack

    ) {
        super(message);
        this.statuscode = statusCode
        this.errors = errors
        this.message = message
        this.success = false;
        this.data = null

        if (stack) {  //to locate errors in file
            this.stack = stack

        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

}

export { ApiError }