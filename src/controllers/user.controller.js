import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken"

// This method is for to generate and refresh access token for the user login 

const generateAccessAndRefershToken = async (userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken
    const refreshToken = user.generateRefreshToken

    user.refreshToken = refreshToken
    user.save({validateBeforeSave : false})

    return {accessToken, refreshToken}
  }

  catch {
    throw new ApiError(500, "Something went wrong while generating token")
  }
}




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




// Login the user 

const loginUser = asyncHandler(async (req,res)=>{
  // req body - > data 
  const {email, username, passowrd} = req.body
  
  if(!username || !email ) {
    throw new ApiError (400, "Username or email is required")
  }


  // username or email 



  const user = await User.findOne({
    $or:[{username}, {email}]
  })




  // find the user 

  

  if (!user) {
    throw new ApiError(404, "User does not exist ")
  }


  // password check 


  

  const isPasswordValid =  await user.isPasswordCorrect(passowrd)
  if (!isPasswordValid) {
    throw new ApiError(404, "Password does not match ")
  }





  // access and refresh token


  const {accessToken, refreshToken} = await generateAccessAndRefershToken(user._id)


  // send cookie

  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const options = {
    httpOnly : true , // ye karne se ye sirf server se modify hoti hai 
    secure : true
  }

  return res.status(200).cookie("accesToken", accessToken, options).cookie("refreshToken", refreshToken, options).
  json(
    new ApiResponse(
      200, {
        user : loggedInUser, accessToken, refreshToken
      },
      "User Logged In Successfully "
    )
  )

} )




// Logged Out User 

const logoutUser = asyncHandler(async(req, res)=>{
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken : undefined
      }
    },
    {
      new : true
    }
  )

  const options = {
    httpOnly : true , // ye karne se ye sirf server se modify hoti hai 
    secure : true
  }

  return res.status(200).clearCookie("refresh", options).
  json (new ApiResponse(200, {}, "User Logged Out Successfully"))
})


const refreshAccessToken = asyncHandler(async (req,res)=>{
 const incomingRefreshToken =  req.cookies.refreshToken = req.cookies.refreshToken||req.body.refresh.Token
 if(incomingRefreshToken){
  throw new ApiError(401, "Unauthorized request")
 }
try {
  
   const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
   )
  
   const user = await User.findById(decodedToken?._id)
  
   if(incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
   }
  
   if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401, "Refresh Token is expired or used")
  
   }
  
   const options = {
    httpOnly : true,
    secure : true
   }
  
   const {accessToken, newrefreshToken} = await generateAccessAndRefershToken(user._id)
  
   return res.status(200).cookie("accessToken ", accessToken ).cookie("refreshToken", newrefreshToken).
   json(
    new ApiResponse(200,{accessToken,refreshToken:newrefreshToken}, "Access Token Loaded Succesfully")
   )
  
} catch (error) {
  throw new ApiError(400 ,"Error occured at refresh token")
}
})



const changeCurrentPassword = asyncHandler(async (req,res)=>{
  const {oldPassword, newPassword} = req.body

  if(!oldPassword || !newPassword){
    throw new ApiError(400, "Old Password and New Password is required")
  }

  const user = await User.findById(req.user._id).select("+password")

  if(!user){
    throw new ApiError(404, "User does not exist ")
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordValid){
    throw new ApiError(400, "Old Password is incorrect")
  }

  user.password = newPassword
  await user.save()

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  )

})


const getCurrentUser = asyncHandler(async (req, res)=>{
  return res.status(200).json(
    new ApiResponse(200, req.user, "User fetched successfully")
  )
})


const updateAccountDetails = asyncHandler(async (req, res)=>{
  const {fullName, email, username} = req.body

  if(!fullName || !email || !username){
    throw new ApiError(400, "Fullname, email and username is required")
  }

  const user = await User.findById(req.user._id)

  if(!user){
    throw new ApiError(404, "User does not exist ")
  }

  user.fullName = fullName
  user.email = email
  user.username = username

  await user.save()

  return res.status(200).json(
    new ApiResponse(200, {}, "Account details updated successfully")
  )
}
)


const updateUserAvatar = asyncHandler(async (req, res)=>{
  const avatarLocalPath = req.files?.avatar[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.findById(req.user._id)

  if(!user){
    throw new ApiError(404, "User does not exist ")
  }

  user.avatar = avatar.url
  await user.save()

  return res.status(200).json(
    new ApiResponse(200, {}, "Avatar updated successfully")
  )
}
)

const updateUserCoverImage = asyncHandler(async (req, res)=>{
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image file is required")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage){
    throw new ApiError(400, "Cover image file is required")
  }

  const user = await User.findById(req.user._id)

  if(!user){
    throw new ApiError(404, "User does not exist ")
  }

  user.coverImage = coverImage.url
  await user.save()

  return res.status(200).json(
    new ApiResponse(200, {}, "Cover image updated successfully")
  )
}   
)


export {registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser, 
  updateAccountDetails, 
  updateUserAvatar,
  updateUserCoverImage}