const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt =require('jsonwebtoken')



const register=async(req,res)=>{
    try{
      const {userName,email,password}=req.body;
       //if user already exist return resposne 
    
       
       if(await User.findOne({email})){

        return res.status(409).send('User already exists. Please login')
       }
       //else  save in db
       const hashedPassword=await bcrypt.hash(password,10)
       const user={
        userName,email,password:hashedPassword
       }
       await User.create(user);
       res.status(201).send('User successfully signed up');
    }catch(error){
          console.log(error);
          
          res.status(500).send('Error encoutered while registering user');
    }


}

const login=async(req,res)=>{
  try{
   const {email,password}=req.body;
   const user= await User.findOne({email});
   if(!user) return res.status(401).send('No account found with this email');
   const decodedPassword= await bcrypt.compare(password,user.password);
   if(!decodedPassword){
      return res.status(401).send('Wrong password');
   }
   else{
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
   }

  }
  catch(error){                
    console.log(error);                                                                     
    res.status(500).send('Error encountered while logging in');                             
  }  
}

const refresh=async(req,res)=>{
  try{
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken) return res.status(401).send('No refresh token');

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findOne({ refreshToken });
    if(!user) return res.status(403).send('Invalid refresh token');

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  }catch(error){
    console.log(error);
    res.status(403).send('Invalid or expired refresh token');
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '_id email userName');
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
};

module.exports={register,login,refresh,getUsers};