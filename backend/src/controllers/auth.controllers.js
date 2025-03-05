
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { generateToken } from '../utils/utils.js';
import cloudinary from "../lib/cloudinary.js";



export const signup = async (req, res) => {
    const {fullName , email , password} = req.body;

    try {
        if(!fullName || !email || !password) {
            return res.status(400).json({message:"All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({message:"Password must be atleast 6 characters long"});
        }

        const user = await User.findOne({email});

        if(user){
            return res.status(400).json({message:"User already exists with this email"});
        }
        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password , salt);

        const newUser = new User({
            fullName,
            email,
            password:hashedPassword,
        })

        if(newUser){
            generateToken(newUser._id , res);
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            })
        }
        else{
            res.status(400).json({message:"Invalid user data"});
        }
        
    } catch (error) {
        console.log("Error in signup controller: ",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}


export const login = async (req, res) => {
    const {email , password} = req.body;

    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const isPasswordCorrect = await bcrypt.compare(password , user.password);

        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid credentials"});
        }

        generateToken(user._id , res);

        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic,
        })
        
    } catch (error) {
        console.log("Error in login controller: ",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}


export const logout = async (req, res) => {
    try {
        res.cookie("jwt","" , {maxAge:0});
        res.status(200).json({message:"Logged out successfully"});
    } catch (error) {
        console.log("Error in logout controller: ",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}


export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body;

        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"Profile picture is required"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {profilePic:uploadResponse.secure_url},
            {new:true}
        )

        res.status(200).json(updatedUser);

    } catch (error) {
        console.log("Error in updateProfile controller: ",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller: ",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}