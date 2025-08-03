import Jwt from 'jsonwebtoken'
export const UserId=async(req,res,next)=>{
    const {jwt} =req.cookies;
    if(!jwt){
        return res.status(401).json({success:false,message:'Not authorized , Login again!'})
    }
    try{
      const jwtSecret=process.env.JWT_SECRET
      const decoded=Jwt.verify(jwt,jwtSecret)
      if (decoded.User_id){
        req.user_id=decoded.User_id
        next()
      }
      else{
        return res.status(401).json({ success: false, msg: "Not authorized, login again" });
      }
    }catch(err){
        console.log("⛔ Token verification failed:", err.message);
        return res.status(401).json({ success: false, msg: "Not authorized, login again" });
    }
}