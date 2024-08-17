// require('dotenv').config({ path : './env'}) //.env in home directory -> old


import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' }); // Ensure correct path if necessary

import connectDB from './db/index.js';

// console.log('MONGODB_URL:', process.env.MONGODB_URL); // Check if environment variable is loaded


connectDB();








/*  ->first approach

import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express()

//IIFE

;(async () =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        //if db is connected but express app fails

        app.on("error" , (err)=>{
            console.log("Error :" ,err);
            throw err;
            
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
            
        })
    }
    catch(err){
        console.error("ERROR : ",err);
        throw err;
    }
})();

*/