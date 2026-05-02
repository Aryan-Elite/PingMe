const mongoose = require('mongoose'); 
const dotenv=require('dotenv');
const uri=process.env.MONGODB_URI;

const connectDB=async()=>{
try{
    await mongoose.connect(uri);
     console.log('MongoDB connected');
}catch(error){
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
    }
}
module.exports=connectDB;