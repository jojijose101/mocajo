
const { reject, resolve } = require('promise')
var db = require('../config/connection')
var collection= require('../config/collection')
const async = require('hbs/lib/async')
const { response } = require('express')
var objectId=require('mongodb').ObjectId
module.exports = {
    addProduct: (product, callback) => {
     
        db.get().collection('product').insertOne(product,(err,data) => {
            if(err)throw err
       
            callback(data.insertedId)

        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
          
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
    console.log(resolve)
    resolve()
})
        })
    }, 
    getproductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    price:proDetails.price,
                    Description:proDetails.Description                   
                
                }
            }).then((responce)=>{
resolve()
            })
        })
    }
}