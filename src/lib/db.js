import mongoose from 'mongoose'
export const connectDB=async()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database Connected to Host:${conn.connection.host}`)
    }catch(error){
        console.log("something error occured:",error)
    }
}