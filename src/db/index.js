import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// another continent me hai na

const connectDB = async () => {
    try{
       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\nMongoDB connected !! DB Host : ${connectionInstance.connection.host}`)
    }catch (error){
        console.log("MONGODB connection error ", error)
        process.exit(1)
    }
}


export default connectDB


// process.env.variable_name is METHOD USED FOR IMPORTING THE VARIABLE FROM ENV FILE JUST LIKE
// DATA MODELING WHERE WE USE  mongoose.schema.types.objectID
