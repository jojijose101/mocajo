var db = require("../config/connection");
var collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { resolve, reject } = require("promise");
const { response } = require("express");
const async = require("hbs/lib/async");
const Razorpay = require('razorpay') 
var objectId = require("mongodb").ObjectId;
var instance = new Razorpay({
  key_id: 'rzp_test_22f3YSz7RVfoQy',
  key_secret: '5gJEsuGKGlj1zCeEDYT8Shmm',
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve,reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);

      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData).then((data)=>{
          resolve(data.insertedId)
        })
       
    });
  },
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
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          product => product.item==proId
        );
        console.log(proExist);
        if (proExist!=-1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {user:objectId(userId), 'products.item': objectId(proId) },
              {
                $inc: { 'products.$.quantity':1 }
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj }
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj]
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
   
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind:'$products'
          },
         {
          $project:{
          item:'$products.item',
          quantity:'$products.quantity'
        }
         },
         {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
         },
         {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
         }
        ])
        .toArray();
      
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity:(details)=>{
   details.count=parseInt(details.count)
   details.quantity=parseInt(details.quantity)
    return new Promise((resolve,reject)=>{
      if(details.count==-1&& details.quantity==1){
        db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          {_id:objectId(details.cart),'products.item': objectId(details.product) },
   {
$pull:{products:{item:objectId(details.product)}}
   }
          ).then((response)=>{
            resolve({removeProduct:true})
          })
        
      }else{
      db.get()
      .collection(collection.CART_COLLECTION)
      .updateOne(
        {_id:objectId(details.cart),'products.item': objectId(details.product) },
        {
          $inc: {'products.$.quantity':details.count }
        }
      )
      .then((response) => {
        resolve({status:true});
      });
    }
    })
  },
  removeProductCart:(remove)=>{
    return new Promise((resolve,reject)=>{
      db.get() .collection(collection.CART_COLLECTION)
      .updateOne(
        {_id:objectId(remove.cart),'products.item': objectId(remove.product) },
        {
          $pull:{products:{item:objectId(remove.product)}}

        }

      ).then((response)=>{
        resolve({removeProduct:true})
      })
    })
  },
  getTotalAmount:(userId)=>{
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind:'$products'
          },
         {
          $project:{
          item:'$products.item',
          quantity:'$products.quantity'
        }
         },
         {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
         },
         {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
         },
         {
          $group:{
          _id:null,
            total:{$sum:{$multiply: ['$quantity',{$toInt: '$product.price'}]}}
          }
         }
         
         
        ])
        .toArray();
      if(total==0){

        resolve(total)
      }else{
        resolve(total[0].total);
      }
      
      
    });
  },
placeOrder:(order,products,total)=>{
  return new Promise((resolve,reject)=>{
 
    let status= order['payment-method']==='COD'?'placed':'pending'
    let orderObj={
      deliveryDetails:{
      name:order.name,
      mobile:order.mobile,
      address:order.address,
      pincode:order.pincode
    },
    userId:objectId(order.user),
    paymentMethod:order['payment-method'],
    products:products,
    totalAmount:total,
    status:status,
    date:new Date()
    }
    db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
      db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.user)})
             resolve(response.insertedId)
       
     
    })
  })
},


getCartProductList:(userId)=>{

  return new Promise(async(resolve,reject)=>{
    let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

    resolve(cart.products)
  })
},



getUserOrder:(userId)=>{
  return new Promise(async(resolve,reject)=>{

    let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)})
    .toArray()

    resolve(orders)
  })
},
getOrderProducts:(orderId)=>{
  return new Promise(async(resolve,reject)=>{
    let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match: { _id: objectId(orderId) },
      },
      {
        $unwind:'$products'
      },
     {
      $project:{
      item:'$products.item',
      quantity:'$products.quantity'
    }
     },
     {
      $lookup:{
        from:collection.PRODUCT_COLLECTION,
        localField:'item',
        foreignField:'_id',
        as:'product'
      }
     },
     {
      $project:{
        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
      }
     }
     
     
    ]).toArray();
    resolve(orderItems)
  })
  
},
generaterRazorpay:(orderId,total)=>{
  return new Promise((resolve,reject)=>{
    

    var options ={
      amount: total*100,
      currency: "INR",
      receipt: ""+orderId
    };
   instance.orders.create(options,function(err,order){
    if(err){
console.log(err)
    }else{
console.log("New Order :",order)
resolve(order)
}
   })
    })
   
  
},
verifyPayment:(details)=>{
  console.log(details)
  return new Promise((resolve,reject)=>{
    const crypto = require('crypto');
    let hash = crypto.createHmac('sha256',  '5gJEsuGKGlj1zCeEDYT8Shmm')
    hash.update(details['payment[razorpay_order_id]']+'|'+details[ 'payment[razorpay_payment_id]'])
    hash=hash.digest('hex')
if(hash==details['payment[razorpay_signature]']){
  resolve()
}else{
  reject()
}



  })
},
changePaymentstatus:(orderId)=>{
  console.log("*****************************",orderId)
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION)
    .updateOne({_id:objectId(orderId)},
    {
      $set:{
        status:'placed'
      }
    }
    
    
    ).then(()=>{
      resolve()
    })
  })
}

};
