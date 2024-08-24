// require('dotenv').config({ path : './env'}) //.env in home directory -> old


import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' }); // Ensure correct path if necessary

import connectDB from './db/index.js';
import { app } from './app.js'


connectDB()                 //a promise is returned as we used async await over there
    .then(() => {
        // console.log("connection successfull");

        try {
            app.listen(process.env.PORT || 8000, () => {
                console.log(`server running on ${process.env.PORT}`);

            });
        }
        catch (err) {
            console.log("Error while listening ", err);
        }

    })
    .catch((err) => {
        console.log("Mongodb connection failed");

    })








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