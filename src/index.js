// requiring the env file 
// require('dotenv').config({ path: './env' });

import dotenv from "dotenv"
dotenv.config({
    path:'./env'
})

// Importing the mongoose 
import mongoose from "mongoose"
// Importing the overall function to connect mongoose from db-->index.js
import connectDB from "./db/index.js"
import { app } from "./app.js"

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo Db connection failed !!! ", err);
})






//  [ THIS IS THE SECOND TYPE OF APPROACH ]

/*

import express from "express"
// assigining the app
const app = express()
// function to connect db
(async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`)
       app.on("Error : ", (error)=>{
        console.log("ERROR", error);
        throw error
       })

       app.listen(process.env.PORT, ()=>{
        console.log("Port is running on the : ", process.env.PORT)
       })
    }catch (error){
        console.error("Error :", error)
        throw error
    }
})()


// process.env.variable_name is METHOD USED FOR IMPORTING THE VARIABLE FROM ENV FILE JUST LIKE
// DATA MODELING WHERE WE USE  mongoose.schema.types.objectID


*/