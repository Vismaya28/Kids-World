var express = require('express');
const { response } = require('../app');
const userHelpers=require('../helpers/user-helpers');
const productHelpers = require('../helpers/product-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const { verify } = require('crypto');


var router = express.Router();
/* GET users listing. */
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.render('admin/admin-login',{login:false,adminLogin:true})
  }
}
router.get('/dashboard',verifyLogin,async(req,res)=>{
 
    adminHelpers.monthlyReport().then((data)=>{

      res.render("admin/dashboard",{admin:true,data});
    })

  })

  router.get('/',verifyLogin, function(req, res, next) {
 
    res.render('admin/admin-login',{adminLogin:true}) 

   
});
router.get('/admin-login',verifyLogin,(req,res)=>{
  res.render('admin/admin-login',{adminLogin:true})
})
var Credential = {
  email:"admin@gmail.com",
  password:"1234567"
}


router.post('/admin-login',function(req,res,next){
  if(req.body.email==Credential.email&&req.body.password==Credential.password){
    

      req.session.adminLoggedIn=true
      
      
      console.log('login successful');
      res.redirect('/admin/dashboard')
    
  }
  else{
    req.session.loginErr="Invalid username or password"
    res.redirect('/admin/admin-login')
  }
})

  
router.get('/admin-logout',verifyLogin,(req,res)=>{
  req.session.admin=false
  res.redirect('/admin')
})

// products
router.get('/view-products',(req,res)=>{
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
})

router.get('/add-product',function(req,res){
  adminHelpers.getAllCategory().then((categorys)=>{

  res.render('admin/add-product',{admin:true,categorys})
})
})

router.post('/add-product',verifyLogin,(req,res)=>{

  adminHelpers.findCategory(req.body.category).then((data)=>{
    productHelpers.addProduct(data,req.body,(id)=>{


      if (req.files?.Image1){
        let image1=req.files?.Image1
        image1.mv('./public/images/'+id+'.jpg')
      }    
      if (req.files?.Image2){
        let image2=req.files?.Image2
        image2.mv('./public/images/'+id+'a.jpg')
      }
      if (req.files?.Image3){
        let image3=req.files?.Image3
        image3.mv('./public/images/'+id+'b.jpg')
      }
res.redirect('/admin/view-products')
    })
  })
})



router.get('/delete-product/:id',(req,res)=>{  
  let proId=req.params.id 
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/view-products')
  })
  
})
router.get('/edit-product/:id',async(req,res)=>{
 let product=await productHelpers.getProductDetails(req.params.id)
 console.log(product);
 res.render('admin/edit-product',{admin:true,product})
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-products')
    if(req.files?.Image){
      let image=req.files?.Image 
      image.mv('./public/images/'+id+'.jpg')
    }
  })
})



router.get("/view-category", verifyLogin, (req, res) => {
  adminHelpers.getAllCategory().then((categorys) => {
    console.log("show all",categorys);
    res.render("admin/view-category", { admin: true,categorys});
  });
});
// add-category
router.get("/add-category", verifyLogin, (req, res) => {
  res.render("admin/add-category", { admin: true });
});

router.post("/add-category", verifyLogin, (req, res) => {
  adminHelpers.addCategory(req.body);
  console.log("success",req.body);
  res.redirect("/admin/view-category");
});
// delete-category
// router.get("/delete-category", verifyLogin, (req, res) => {
//   let proId = req.query.id;
//   adminHelpers.deleteCategory(proId).then((response) => {
//     res.redirect("/admin/view-category");
//   });
// });

router.get('/delete-category',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  adminHelpers.deleteCategory(proId).then((response)=>{
  res.redirect('/admin/view-category')
  })
  
})
// edit-category
router.get('/edit-category',verifyLogin,(req,res)=>{
  console.log("zdxfcvbn");
  let id=req.query.id
  console.log('hii',id);
adminHelpers.findCategory(id).then((data)=>{
  console.log('data',data);
  
  res.render('admin/edit-category',{data,admin:true})
})
})

router.post('/edit-catagory',(req,res)=>{
  let id=req.query.id
  cata=req.query.data
  adminHelpers.editCategory(id,req.body).then((response)=>{
   
    adminHelpers.categoryEdit(id,req.body).then((response)=>{
      res.redirect('/admin/view-category')
    })
  
  })
})




// user
router.get('/add-user',function(req,res){
  res.render('admin/add-user',{admin:true})
})
router.post('/add-user',(req,res)=>{
 
  router.post('/add-users',(req,res)=>{
  
    userHelpers.doSignup(req.body).then((response)=>{
     
      res.redirect('/admin/view-users')
    })
   })

  })

  router.get("/view-users", verifyLogin, (req, res) => {
    productHelpers.getAllUsers().then((users) => {
      res.render("admin/view-users", { admin: true, users });
    });
  });
  router.get("/add-user", verifyLogin, (req, res) => {
    let EmlMobErr= req.session.EmlMobErr
    
  
    res.render("admin/add-user", { admin: true,EmlMobErr });
    req.session.EmlMobErr=false
    
  });

// blockuser
router.get('/block-user',verifyLogin,(req,res)=>{
  let userId = req.query.id
  userHelpers.blockUser(userId).then((response)=>{
    res.redirect('/admin/view-users')
  })
})

// unblockuser
router.get('/unblock-user',verifyLogin,(req,res)=>{
  let userId = req.query.id
  userHelpers.unBlockUser(userId).then((response)=>{
    res.redirect('/admin/view-users')
  })
})
router.get('/order',verifyLogin,(req,res)=>{
  adminHelpers.allOrders().then((orders)=>{
    res.render("admin/order",{admin:true,orders})
  })
})

// router.get('/change-status',verifyLogin,async(req,res)=>{
//   let orderId= req.query.id
//   var status;
//   if(req.query.status="Cancelled"){
//     status="Cancelled"
//   }else if(req.query.status="Shipped"){
//     status="Shipped"
//   }else if(req.query.status="Delivered"){
//     status="Delivered"
//   }else if(req.query.status="Placed"){
//     status="Placed"
//   }
//   let Status= await adminHelpers.updateStatus(orderId,status).then((response)=>{
   
//   })
// })

router.get('/changeStatus',async(req,res)=>{
  console.log("helooooooo");
  let orderId=req.query.id
  let newStatus=req.query.status
  let deliveryStatus=false
  let cancelStatus=false
  if(newStatus=="Delivered"){
    deliveryStatus=true
  }
  if(newStatus=="Cancelled"){
    cancelStatus=true
   
  }
  adminHelpers.updateStatus(orderId,newStatus,cancelStatus,deliveryStatus).then((response)=>{
  res.redirect('/admin/order')
  })
})


router.get('/view-banner',(req,res)=>{
  
  productHelpers.getAllBanner().then((banners)=>{
    res.render('admin/view-banner',{admin:true,banners})
  })
})
router.get('/add-banner',(req,res)=>{
    res.render("admin/add-banner",{admin:true})
  })



  router.post("/add-banner",(req,res)=>{
    productHelpers.addBanner(req.body).then((id)=>{
      let image=req.files.Image

      image.mv('./public/banner-images/'+id+'.jpg')
      res.redirect('/admin/view-banner')
    })
  })
  
router.get('/delete-banner',verifyLogin,(req,res)=>{
  
  let Id=req.query.id
  productHelpers.deleteBanner(Id).then((response)=>{ 
    res.redirect('/admin/view-banner')
  })
})
router.post('/date-report',(req,res)=>{
  let endDate=req.body.endDate
  let startDate=req.body.startDate
  adminHelpers.dateReport(startDate,endDate).then((data)=>{
    res.render('admin/sales-report',{admin:true})
  })
})
router.get('/limit-report',verifyLogin,(req,res)=>{
  let today=new Date();
  let endDate= moment(today).format('YYYY/MM/DD')
  let startDate=moment(endDate).subtract(30,'days').format('YYYY/MM/DD')
  if(req.query.limit=='yearly'){
    
    startDate=moment(endDate).subtract(364,'days').format('YYYY/MM/DD')
  }else if(req.query.limit=='monthly'){
   
    startDate=moment(endDate).subtract(30,'days').format('YYYY/MM/DD')
  }else if(req.query.limit='weekly'){
    
    startDate=moment(endDate).subtract(7,'days').format('YYYY/MM/DD')
  }
  adminHelpers.dateReport(startDate,endDate).then((data)=>{
    res.render('admin/report',{admin:true,data})
  })
  

})
router.get('/sales-report',verifyLogin,(req,res)=>{ 
  adminHelpers.monthlyReport().then((data)=>{
    adminHelpers.allOrders().then((orders)=>{
      res.render('admin/sales-report',{admin:true,data,orders})
    })
  })
})
router.get('/view-productOffers',verifyLogin,(req,res)=>{
  adminHelpers.getAllproOffers().then((proOffers)=>{
    res.render('admin/view-productOffers',{admin:true,proOffers})

  })
})

router.get('/add-productOffer',verifyLogin,(req,res)=>{
  // adminHelpers.getAllproOffers().then((proOffers)=>{
    productHelpers.getAllProducts().then((products)=>{

    
    res.render('admin/add-productOffer',{admin:true,products})
  })
  
})
// router.get('/add-productoffer',verifyLogin,(req,res)=>{
//   productHelpers.getAllProducts().then((product)=>{
//     res.render('admin/add-productoffer',{admin:true,product})
//   })
// })
router.post('/add-productoffer',(req,res)=>{
  adminHelpers.addProductOffer(req.body).then((response)=>{
    if(response.exist){
      req.session.proOffersExist=true.
      res.redirect("/admin/view-productOffers")
    }else{
      res.redirect("/admin/view-productOffers")
    }
  })
})
router.get('/delete-proOffer', verifyLogin,(req,res)=>{
  let id=req.query.id
  adminHelpers.deleteProOffer(id).then((response)=>{

    res.redirect("/admin/view-productOffers")  
  })
})
router.get('/sales-report',(req,res)=>{
  adminHelpers.monthlyReport().then((data)=>{
    res.render("admin/sales-report",{admin:true,data})
  })
})


router.get('/view-coupon',verifyLogin,(req,res)=>{
  adminHelpers.getAllCoupons().then((coupons)=>{
    res.render('admin/view-coupon',{admin:true,coupons})
  })
})
router.get('/coupon-add',verifyLogin,(req,res)=>{
  res.render('admin/add-coupon',{admin:true})
})
router.post('/coupon-add',(req,res)=>{
  adminHelpers.addCoupon(req.body).then((response)=>{
    res.redirect('/admin/view-coupon')
  })
})

router.get('/delete-coupon', verifyLogin,(req,res)=>{
  Id=req.query.id
  adminHelpers.deleteCoupon(Id).then((response)=>{
    res.redirect('/admin/view-coupon')
  })
})

module.exports = router;