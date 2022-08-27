
var express = require("express");
const async = require("hbs/lib/async");
const productHelpers = require("../helpers/product-helpers");
var router = express.Router();
const adminHelper=require('../helpers/admin-helper')
const verifyadminlogin = function(req, res, next){
  if (req.session.adminloggedIn) {
    next();
  } else {
  res.redirect("/adminlogin");
  }
};

/* GET users listing. */


router.get("/", function (req, res, next) {
  let adminI=req.session.admin
 adminHelper.AllProducts().then((products) => {
    console.log(products);
   return res.render('admin/admin-products', { admin:true, products,adminI });
  });
});





router.get("/adminlogin",function(req,res){
  if (req.session.admin){
    return res.redirect('/admin')
  }else{
  res.render('admin/adminlogin',{"loginErr":req.session.adminloginErr, admin:true})
    req.session.adminloginErr=false
  }
  })
  router.post("/adminlogin",function(req,res,next){
    adminHelper.doLogin (req.body).then((response)=>{
      if(response.status){  
       
        req.session.admin=response.user
        req.session.adminloggedIn = true;
    return  res.redirect('/admin')
    }else{
      res.render('users/login',{"loginErr":req.session.adminloginErr})
      req.session.admin=false
    }
    })
  })
 
  router.get("/all-users", verifyadminlogin,function(req,res,next){
    let adminI=req.session.admin
   adminHelper.allUsers().then((users)=>{
    
    res.render("admin/all-users",{admin:true,users,adminI})
  })

  })
router.get("/add-product",verifyadminlogin,  function (req, res) {
  let adminI=req.session.admin
  res.render("admin/add-product", { admin: true, adminI });
});
router.post("/add-product", (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image;
    console.log(id);
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product", { admin: true });
      } else {
        console.log(err);
      }
    });
  });
});
router.get("/delete-product/:id", (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response) => {
  return  res.redirect("/admin");
  });
});
router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelpers.getproductDetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product, admin: true });
});
router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
  return  res.redirect("/admin");
    if (req.files.image) {
      let image = req.files.image;
      image.mv("./public/product-images/" + id + ".jpg");
    }
  });
});








module.exports = router;
