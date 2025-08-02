import { generateToken } from "../lib/utils.js"
import User from "../model/User.model.js"
import bcrypt from 'bcryptjs'
export const SigUp=async(req,res)=>{
    const {email,fullName,password}=req.body;
    try{
    if (!email || !fullName || !password){
        return res.status(400).json({success:false,message:"All fields are required"})
    }
    if (password.length<8){
        return res.status(400).json({success:false,message:'Password must have 8 characters'})
    }
    const user=await User.findOne({email})
    if(user){
        return res.status(401).json({success:false,message:'email already exists'})
    }
    const salt=await bcrypt.genSalt(10)
    const hashedPassword=await bcrypt.hash(password,salt)
    const newUser=new User({
        fullName,email,password:hashedPassword
    })
    if(newUser){
        generateToken(newUser._id,res);
        await newUser.save()
        return res.status(201).json({
            success:true,
            userData:{
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email,
                profile_pic:newUser.profile_pic,
                isAccountVerified:newUser.isAccountVerified
            },
            message:'user registered successfully'
        })
    }else{
        res.status(500).json({success:false,message:'internal server error'})
    }
}catch(err){
    console.log('error in signup')
    res.status(500).json({success:false,message:'internal server error'})
}

}
export const Login=async(req,res)=>{
    const {email,password}=req.body
    try{
        if(!email || !password){
            return res.status(400).json({success:false,message:'all fields are required'})
        }
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({success:false,message:'invalid credentials'})
        }
        const isPasswordCorrect=await bcrypt.compare(password,user.password)
        if(!isPasswordCorrect){
            return res.status(400).json({success:false,message:'wrong password'})
        }
        generateToken(user._id,res)
        res.status(200).json({
            success:true,
            userData:{
                _id:user._id,
                fullName:user.fullName,
                email:user.email,
                profile_pic:user.profile_pic
            },
            message:'user logged in successfully'
        })
    }catch(err){
        console.log(err)
        res.status(500).json({success:false,message:"internal server error"})
    }

}
export const Logout=async(req,res)=>{
    try{
        res.clearCookie('jwt',{
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        return res.status(200).json({success:true,msg:"logged out successfully"});
    }
    catch(err){
        return res.status(500).json({success:false,errormessage:err.message});
    }
}