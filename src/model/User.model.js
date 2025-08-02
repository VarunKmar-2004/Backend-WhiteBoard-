import mongoose from "mongoose";
const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },
    fullName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    profile_pic:{
        type:String,
        default:'',
    },
    isAccountVerified:{type:Boolean,default:false},
    verifyOtp:{type:String,default:""},
    verifyOtpExpiry:{type:Number,default:0},
    resetOtp:{type:String,default:""},
    resetOtpExpiry:{type:Number,default:0}
},
{timestamps:true}
)
const User=mongoose.model('User',UserSchema)
export default User;