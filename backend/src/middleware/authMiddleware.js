const jwt = require('jsonwebtoken')


const protect=(req,res,next)=>{
try{

const token=req.headers.authorization.split(' ')[1];
   const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    req.user=decoded;
    next();
}
catch(error){
  res.status(401).send('Unauthorized');
}
}

module.exports = protect;