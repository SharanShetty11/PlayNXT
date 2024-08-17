import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

// import dotenv from 'dotenv'
// dotenv.config({path : '../.env'});

const connectDB = async () => {
    try{
        //mongoose returns 'connection object'

       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
       // to determine where the db is connected (there is separate db's for production , dev , testing..)
       console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
    }
    catch(err){
        console.error(`MongoDB Connection Failed : ${err}`)
        // console.log('hello');
        
        process.exit(1)
        //this 'process' is available in Nodejs 
    }
}

// connectDB()

export default connectDB;
