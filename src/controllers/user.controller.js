import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler(async (req, res)=>{
   // get user details from the frontend
   const {fullName, email , username , password} = req.body
   console.log("email : " , email);
   
   
   // validation - Not empty
    //    if(fullName===""){
    //     throw new ApiError(400, "Fullname is required")
    //    }

      if (
        [fullName,email,username,password].some((field)=>field?.trim()==="")
      ) {
        throw new ApiError(400,"All fields are required")
      }


   // check of user if already exist - [ username, email]
   const existedUser = await User.findOne({
    $or:[{username},{email}]
   })
   

   if(existedUser){
    throw new ApiError(409, "User with email or username already exist ! Please login  ")
   }

   
   // check for avatar , images
   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
   }


   // upload to them cloudinary  - 

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar ) {
    throw new ApiError(400 , "Avatar File is required ")
   }

   
   // create user object - create entry in db
   const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email , 
    password , 
    username : username.toLowerCase()
   })


   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500, "Something went wrong while creating a user ! Please try again after some time")
   }

   // remove password and refersh token 
   // check for user creastion
   // return res

   return res.status(201).json(
    new ApiResponse(200,createdUser , "User created succesfully" )
   )

})


export {registerUser}