var express = require('express');
const async = require('hbs/lib/async');

var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelper=require('../helpers/user-helper')

const verifylogin=(req,res,next)=>{
  if (req.session.userloggedIn){
    next()
  }else{
  res.redirect("/login")
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
 console.log(user)
 let cartCount=null
 if(req.session.user){
 cartCount=await userHelper.getCartCount(req.session.user._id)
}
  productHelpers.getAllProducts().then((products) =>{
    res.render('users/view-products',{products,user,cartCount});
  });
})
router.get('/login',(req,res)=>{
  if (req.session.user){
    return res.redirect('/')
  }else{
  res.render('users/login',{"loginErr":req.session.userloginErr})
    req.session.userloginErr=false
  }
  })

router.get('/signup',(req,res)=>{
  res.render('users/signup')
})


router.post('/signup',(req,res)=>{
userHelper.doSignup(req.body).then((response)=>{
console.log(response)

    res.redirect('/login')

})
})

router.post("/login",(req,res,next)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){  
     
      req.session.user=response.user
      req.session.userloggedIn = true;
    res.redirect('/')
  }else{
    req.session.userloginErr="Invalid username or password"
    res.redirect('/login')
  }
  })
})



router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userloggedIn=false
  res.redirect("/")
})



  router.get('/cart',verifylogin,async(req,res)=>{
  
    let products=await userHelper.getCartProducts(req.session.user._id)
    let totalValue=await userHelper.getTotalAmount(req.session.user._id)
    let user =req.session.user._id
  res.render('users/cart',{products,user,totalValue,user:req.session.user})
  })

 router.get('/add-to-cart/:id',(req,res)=>{

  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
   return res.json({status:true})
  })
 })
router.post('/change-product-quantity',(req,res,next)=>{
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelper.getTotalAmount(req.body.user)
   return res.json(response)
  })

})
router.post('/remove-product',(req,res,next)=>{
  userHelper.removeProductCart(req.body).then((response)=>{
    res.json(response)
  })

  })
  router.get('/place-order',verifylogin, async(req,res)=>{
    let total=await userHelper.getTotalAmount(req.session.user._id)
      res.render('users/place-order',{total,user:req.session.user})
    
  })
  router.post('/place-order',async(req,res)=>{
    let products=await userHelper.getCartProductList(req.session.user._id)
  let totalPrice=await userHelper.getTotalAmount(req.session.user._id)
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
   
   if(req.body['payment-method']=='COD'){
    res.json({codSuccess:true})
   }else{
    userHelper.generaterRazorpay(orderId,totalPrice).then((response)=>{
res.json(response)
    })
  }
     })
    })
    router.get('/order-placed',verifylogin,async(req,res)=>{
    res.render('users/order-placed',{user:req.session.user})

      })
      router.get('/demo',verifylogin,(req,res)=>{
        res.render('users/demo')
      })

   
       

 router.get('/orders',verifylogin,async(req,res)=>{
  let orders=await userHelper.getUserOrder(req.session.user._id)
    res.render('users/orders',{user:req.session.user,orders})
   
      })

router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelper.getOrderProducts(req.params.id)
  res.render('users/view-order-products',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
  console.log('++++++++++++++++++++++++++++++++++++++++++++++',req.body)
userHelper.verifyPayment(req.body).then(()=>{
userHelper.changePaymentstatus(req.body['order[receipt]']).then(()=>{
  res.json({status:true})

})
}).catch((err)=>{
  console.log(err)
  res.json({status:false,errMsg:''})
})
})



module.exports = router;
