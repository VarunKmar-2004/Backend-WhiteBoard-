import User from "../model/User.model.js";
export const isAuthenticated=async(req,res)=>{
    try{
        return res.status(200).json({success:true})
    }catch(err){
        console.log('error in isauthenticated route:',err)
        return res.status(401).json({message:err.message});
    }
}
export const getUser=async(req,res)=>{
   try{
    const user=await User.findById(req.user_id)
    if(!user){
        return res.status(401).json({success:false,message:'Unauthorized or No token found'})
    }
    res.status(200).json({success:true,userData:{
        email:user.email,
        fullName:user.fullName,
        profile_pic:user.profile_pic
    }
   })
}catch(err){
   return res.status(500).json({success:false,message:'internal server error'})
}}