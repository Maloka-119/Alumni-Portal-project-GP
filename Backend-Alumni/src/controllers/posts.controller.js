const posts=require('../models/Post')
const postImage=require('../models/PostImage')
const HttpStatusHelper = require('../utils/HttpStatuHelper');
const addPost =async(req,res)=>{
 try{
    

 }
catch(err){
  return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null
    });
}
};