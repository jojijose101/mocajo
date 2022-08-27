var db = require("../config/connection");
var collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { resolve, reject } = require("promise");
const { response } = require("express");
const async = require("hbs/lib/async");
var objectId = require("mongodb").ObjectId;

module.exports = {
doLogin: (userData) => {
    return new Promise(async (resolve,reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });

      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("Login success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  allUsers:()=>{
    return new Promise(async(resolve,reject)=>{
      
        let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
    
    })
},
AllProducts:()=>{
  return new Promise(async(resolve,reject)=>{
    
      let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
  
  })
},



}