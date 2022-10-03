var express = require('express')
const { response } = require('../app')
var router = express.Router()
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const adminHelpers = require('../helpers/admin-helpers')
const paypal = require("paypal-rest-sdk");
const { verify } = require('crypto')
const { resolve } = require('path')



const serviceSID = 'VAe2d910b059aaa3b83d2a95286f8351a6'
const accountSID = 'ACaae8d22ecc7f133bd729169b4f6427de'
const authToken = 'ec86c99b1c478cb589712085cddbdd38'
const client = require('twilio')(accountSID,authToken)


// client_id:"AbwtnhJ3SPoZlA7EWTsqjPZaMhbuSQNp2ikUDZxAGLpUxpRJGqKefCc9zBk5gEC65bU_RwQnPlv9dR1A",
// client_secret:"EEJctOf6B60lCwowFFr5eHL5wuX4QXyhEIFfGecXM6eC1OO0C6NtrodLtL-kLV8JoQqMsTmv9Gt1coHS",

paypal.configure({
  mode: "sandbox",
  client_id:"AbwtnhJ3SPoZlA7EWTsqjPZaMhbuSQNp2ikUDZxAGLpUxpRJGqKefCc9zBk5gEC65bU_RwQnPlv9dR1A",
  client_secret:"EEJctOf6B60lCwowFFr5eHL5wuX4QXyhEIFfGecXM6eC1OO0C6NtrodLtL-kLV8JoQqMsTmv9Gt1coHS",
});

const verifyLogin=(req,res,next)=>{
  if(req.session.userloggedIn){
    next()
  }
  else{
    res.render('user/login')
  }
}

router.get('/',async function(req,res,next){
  let user=req.session.user
  let today= new Date()
  let cartCount=null 
  let wishCount=null
  


  if(req.session.user){
     
   
   cartCount=await userHelpers.getCartCount(req.session.user._id)
   wishCount=await userHelpers.getWishCount(req.session.user._id)
  

 


  }

  


productHelpers.getAllProducts().then((products)=>{
productHelpers.getAllBanner().then((Banners)=>{
  adminHelpers.getAllCategory().then((data)=>{
   adminHelpers.startProductOffer(today)
   adminHelpers.startCouponOffers(today)
   let coupon= adminHelpers.getAllCoupons()
   let couponCode=coupon[0]

console.log('proddsfsfsfdsfds',products);
    res.render('user/view-products',{products,user,cartCount,Banners,data, wishCount,couponCode})
  })

})
  
})

})



router.get('/home',verifyLogin,(req,res)=>{
  res.render('user/view-products')
})
router.get('Kids World',verifyLogin,(req,res)=>{
  res.render('user/view-products')
})
router.get('/login',verifyLogin,(req,res)=>{
  res.render('user/login')
})

router.post('/login',(req,res)=>{
  // console.log('jbhnjinnnnnnj',req.body);
userHelpers.doLogin(req.body).then((response)=>{
  if(response.status){
    // console.log('bts');
    req.session.userloggedIn=true
    req.session.user=response.user
    
    res.redirect('/')
  }else{
    req.session.loginErr="Invalid username or password"
    res.redirect('/user/login')
  }
})
})


router.get('/logout',(req,res)=>{
  req.session.users=null
  req.session.userLoggedIn=false
  req.session.destroy()
  res.redirect('/')
})

router.get('/signup',(req,res)=>{
  
  res.render('user/signup',{user:true})
})
router.post('/signup',(req,res)=>{
  // console.log("result:",req.body);
 userHelpers.doSignup(req.body).then((response)=>{
   console.log("res",response); 
   req.session.loggedIn=true
   req.session.user=response
   res.redirect('/login')
 })
})

// otp


router.get("/otp-number", (req, res) => {
  // console.log("welcome otp");
  let otpNErr = req.session.otpNumberErr;
  let UserBlockErr = req.session.UserBlockErr;
  res.render("user/otp-number", { otpNErr, UserBlockErr });
  req.session.otpNumberErr = false;
  req.session.UserBlockErr = false;
});
// mobile number from otp-login page
router.post("/otp-number", (req, res) => {
  // console.log("post otp");
  userHelpers.findUser(req.body.number).then((resolve) => {

    // console.log("this is ma number: ",req.body.number);
    if (resolve) {
      // console.log("resolve  ");
      if (resolve.status) {
        client.verify
          .services(serviceSID)
          .verifications.create({
            to: `+91${req.body.number}`,
            channel: "sms",
          })
          .then((resp) => {
            req.session.number = req.body.number;

            res.render("user/otp-confirm");
          });
      } else {
        req.session.UserBlockErr = "This Account has been Blocked";
        res.redirect("/otp-number");
        req.session.UserBlockErr = false;
      }
    } else {
      req.session.otpNumberErr = "Mobile Number Not exist";
      res.redirect("/otp-number");
    }
  });
});
// verify otp-code
router.post("/otp-confirm", (req, res) => {
  // console.log("otp confirm");
  let otp = req.body.otp;
  let number = req.session.number;

  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: otp,
    })
    .then((resp) => {
      if (resp.valid) {
        userHelpers.findUser(number).then((response) => {
          req.session.loggedIn = true;
          req.session.user = response;

          res.redirect("/");
        });
      } else {
        req.session.InvalidOtp = "Invalid OTP";
        let errOtp = req.session.InvalidOtp;
        res.render("user/otp-confirm", { errOtp });
        req.session.InvalidOtp = false;
      }
    });
});

// resend otp

router.get("/resend-otp", (req, res) => {
  let number = req.session.number;

  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `+91${number}`,
      channel: "sms",
    })
    .then((resp) => {
      res.render("user/otp-confirm");
    });
});

// router.get('/cart',verifyLogin,(req,res)=>{
//   userHelpers.getCartProducts(req.session.user._id).then((products)=>{
//    let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
//     res.render('user/cart',{user:true,products,user:req.session.user})
//   })

// })
router.get('/cart',verifyLogin,async(req,res)=>{
  // let user=req.session.user
  let products=await userHelpers.getCartProducts(req.session.user._id)
 let cartCount=await userHelpers.getCartCount(req.session.user._id)
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  let wishCount=await userHelpers.getWishCount(req.session.user._id)
  // console.log(products);

  res.render('user/cart',{products,user:req.session.user,totalValue,cartCount,wishCount})
  
})

router.get('/add-to-cart/:id',verifyLogin,async(req,res)=>{

let product = await productHelpers.findProduct(req.query.id);


  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   
    // res.json({status:true})
     
    res.redirect('/')
  })
})

router.post("/remove-cart-product",(req, res) => {
  
  
  userHelpers.removeCartProduct(req.body).then((response) => {

    res.json(response);
  });
});
router.post('/change-product-quantity',(req,res)=>{
  
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    
    response.total=await userHelpers.getTotalAmount(req.body.user)

      res.json(response)
  })
})

// router.get('/view-details',verifyLogin,async(req,res)=>{
// let product=await productHelpers.findProduct().then((product)=>{
// res.render('user/view-details',{user:true,product})
// })
// })   

router.get('/view-details',verifyLogin,async(req,res)=>{
  let proId = req.query.Id
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
  await productHelpers.findProduct(proId).then((product)=>{
    
    res.render('user/view-details',{user:true,product,cartCount,wishCount})
  })
})



 
router.get('/profile',verifyLogin,async(req,res)=>{  
  
    let user=req.session.user
 let cartCount=await userHelpers.getCartCount(req.session.user._id)
 let wishCount=await userHelpers.getWishCount(req.session.user._id)

    userHelpers.getAllAddress(user._id).then((allAddress)=>{

      // console.log("all address");

      res.render('user/profile',{user,allAddress,cartCount,wishCount})
    })
    
  })

  
router.get('/place-order',verifyLogin,async(req,res)=>{
// router.get('/place',verifyLogin,async(req,res)=>{

  
  let user= req.session.user;
  let total = await userHelpers.getTotalAmount(user._id)
  let coupon=await adminHelpers.getAllCoupons()
   userHelpers.getAllAddress(user._id).then((allAddress)=>{
    res.render('user/place-order',{total,user,allAddress,coupon})
    // res.render('user/place',{total,user,allAddress})

   })
  
  
  
})
// router.post('/place-order',verifyLogin, async(req,res)=>{

// console.log('place');
//   let user=req.session.user
  // console.log("user",user);
//   let products=await userHelpers.getCartProductList(req.body.userId)
// console.log('placed');
//   let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
//    console.log("Amounttt");

// userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
// req.session.orderId=orderId;


// })
// console.log('placeddd');
//   console.log(req.body);
// })
router.get('/checkout-out',verifyLogin,async(req,res)=>{
  adminHelpers.getAllCategory().then(async(data)=>{
    let user=req.session.user
    let allAddress=await userHelpers.getAllAddress(user._id)
    let cartCount=await userHelpers.getCartCount(req.session.user._id)
    let total=await userHelpers.getTotalAmount(req.session.user._id)
    let wishCount=await userHelpers.getWishCount(req.session.user._id)
    res.render('user/place-order',{total,data,user,cartCount,allAddress,wishCount})
    // res.render('user/place',{total,data,user,cartCount,allAddress,wishCount})

  })
})

// router.post('/place-order',async(req,res)=>{


//   console.log("place order");
//   if(req.session?.couponId){
//     userHelpers.couponAddressAdd(req.body.userId,req.session.couponId)
//   }
//  let products=await userHelpers.getCartProductList(req.body.userId)
//  let totalPrice=await userHelpers.getTotalAmount(req.body.userId) 
//  userHelpers.placeOrder(req.body,products,totalPrice).then(async(orderId)=>{
//   req.session.orderId=orderId

router.post('/place-order',async(req,res)=>{
  let user=req.session.user
  if(req.session?.couponId){
    userHelpers.couponAddressAdd(req.body.userId,req.session.couponId)
  }
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)

  let totalAmount=totalPrice
  let coupon=false
  let couponDiscount=0

  if(req.session?.couponTotal){
    coupon=true
    couponDiscount=req.session.couponApply
  }else{
    if(req.session?.couponTotal){
      totalAmount=req.session.couponTotal
      coupon=true

      couponDiscount=req.session.couponApply
    }
  }
  userHelpers.placeOrder(req.body,products,totalAmount,totalPrice,coupon,couponDiscount).then((orderId)=>{
req.session.orderId=orderId

  if(req.body['payment-method']==='COD'){
        res.json({codSuccess:true})

  }

  else if(req.body['payment-method']==='Paypal'){
      
      //  let totalValue = totalPrice / 74
      //  let total = totalValue.toFixed(2)
      //  let totals = total.toString()
      //  req.session.total = totals
      //  console.log('getting total',req.session.total);
      
      //  const { orderID } = req.params;
      //  const captureData = await capturePayment(orderID);
      //  res.json(captureData);

      //  async function createOrder() {
      //   const accessToken = await generateAccessToken();
      //   const url = `${base}/v2/checkout/orders`;
      //   const response = await fetch(url, {
      //     method: "post",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //     body: JSON.stringify({
      //       intent: "CAPTURE",
      //       purchase_units: [
      //         {
      //           amount: {
      //             currency_code: "USD",
      //             value: "100.00",
      //           },
      //         },
      //       ],
      //     }),
      //   });
      //   const data = await response.json();
      //   return data;
      // }
      // async function capturePayment(orderId) {
      //   const accessToken = await generateAccessToken();
      //   const url = `${base}/v2/checkout/orders/${orderId}/capture`;
      //   const response = await fetch(url, {
      //     method: "post",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //   });
      //   const data = await response.json();
      //   return data;
      // }
      // async function generateAccessToken() {
      //   const auth = Buffer.from(client_id + ":" + client_secret).toString("base64")
      //   const response = await fetch(`${base}/v1/oauth2/token`, {
      //     method: "post",
      //     body: "grant_type=client_credentials",
      //     headers: {
      //       Authorization: `Basic ${auth}`,
      //     },
      //   });
      //   const data = await response.json();
      //   return data.access_token;
      // }




      let val = totalPrice / 74;
      let total = val.toFixed(2);
      let totals = total.toString();
      req.session.total = totals;


      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cancel",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Red Sox Hat",
                  sku: "001",
                  price: totals,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: totals,
            },
            description: "Hat for the best team ever",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {

        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              let url = payment.links[i].href;
              res.json({ url });
            } else {

            }
          }
        }
      });

      }else if(req.body["payment-method"]==="Razorpay"){
        console.log('razorpay');
        userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
          res.json({...response,razorpaySuccess:true})
        })
      }
  })
  
}) 


router.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let total = req.session.total;
  let totals = total.toString();

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: totals,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {

        throw error;
      } else {

        userHelpers.changePaymentStatus(req.session.orderId).then(() => {
          res.redirect("/order-success");
        });
      }
    }
  );
});
router.get('/cancel',verifyLogin,(req,res)=> res.send("Cancelled"))
 

router.get('/order-success',verifyLogin,(req,res)=>{
  let user=req.session.user;
  res.render('user/order-success',{user})
})



router.get('/orders',verifyLogin,async(req,res)=>{
  

  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})



router.get('/view-order-products',verifyLogin,async(req,res)=>{

let product=await userHelpers.getOrderProducts(req.params.id)
res.render('user/view-order-products',{user:true,user:req.session.user,product})  
})

router.post('/cancel-order',verifyLogin,async(req,res)=>{
  let Id = req.query.id
  console.log('cancel');
  userHelpers.cancelOrder(Id).then((response)=>{
    res.redirect('/user/orders')
  })
})
  router.get("/add-address", verifyLogin, async (req, res) => {
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    let user = req.session.user;
      res.render("user/add-address", { user:true,cartCount});
    });
  
  router.post("/add-address", async(req, res) => {
    let userId = req.session.user._id;
  
    let address =await userHelpers.addAddress(userId, req.body).then((response) => {
      // console.log('address added');
      res.redirect("/profile");
    });
  });

  router.post('/delete-address',verifyLogin,(req,res)=>{
  
    let Id=req.body.addId
    // console.log(Id);
    userHelpers.deleteAddress(req.session.user._id,Id).then((response)=>{ 
    // console.log('delete address');

      res.json({deleteAddress:true})
    })
  })

  

  // router.get("/edit-address", verifyLogin, async (req, res) => {
  //   let addId = req.query.id;
  //   let user = req.session.user;
  //   console.log('Edit address');
  
  //   let cartCount = await userHelpers.getCartCount(req.session.user._id);
  
  //   userHelpers.findAddress(user._id, addId).then((address) => {
  
  
  //     res.render("users/edit-address", {user,cartCount,address});
  //   });
  // });
  // router.post("/edit-address", (req, res) => {
  //   let userId = req.session.user._id;
  
  //   userHelpers.editAddress(userId,req.body).then((response) => {
  //     res.redirect("/profile");
  //   })
  // })


router.get('/edit-profile',verifyLogin,async(req,res)=>{
  // let user = await userHelpers.getUserDetails(req.query.id)
  let user=req.session.user
  res.render('user/edit-profile',{user})
})
// router.post('/edit-profile/:id',(req,res)=>{
//   userHelpers.updateProfile(req.params.id,req.body).then((response)=>{
//     res.redirect('/edit-profile')
//   })
// })
router.post("/edit-profile", verifyLogin, (req, res) => {
  let user = req.session.user;
  let newUser = req.body.fname;

  userHelpers.updateProfile(user._id, req.body).then((response) => {


    req.session.user.fname = newUser;


    res.redirect("/user/profile");
  });
});

router.get("/edit-password", verifyLogin, (req, res) => {
  let passErr = req.session.passwordNotMatch;
  let user = req.session.user;
  res.render("user/edit-password", { user, passErr });
  req.session.passwordNotMatch = false;
});
router.post("/edit-password", (req, res) => {
  
  let userId = req.session.user._id;
  userHelpers.passwordMatch(req.body.oldPassword, userId).then((response) => {
    // console.log('password');
    if (response) {
      // console.log('changed');
      userHelpers.updatePassword(req.body.newPassword, userId).then((response) => {
          req.session.destroy();
          res.redirect("/login");
        });
    } else {
      req.session.passwordNotMatch = "Old Password is Wrong";
      res.redirect("/edit-password");
    }
  });
});
router.post('/verify-payment',(req,res)=>{
  // console.log(req.body);
})


router.post("/apply-coupon", verifyLogin, (req, res) => {
  let Id = req.session.user._id;

  userHelpers
    .couponValidate(req.body, req.session.user._id)
    .then((response) => {
      
      if (response.success) {
        req.session.couponApply=response.oldTotal-response.total;
        req.session.couponTotal = response.total;
        req.session.couponId = response.couponId;
        

        res.json({
          couponSuccess: true,
          total: response.total,
          oldTotal: response.oldTotal,
        });
      } else if (response.couponUsed) {
        res.json({ couponUsed: true });
      } else if (response.couponExpired) {
        res.json({ couponExpired: true });
      } else {
        res.json({ invalidCoupon: true });
      }
    });
});

router.get('/wishlist',verifyLogin,async(req,res)=>{
  let user=req.session.user
  let id=user._id
  let cartCount=null
  if(user){
    cartCount=await userHelpers.getCartCount(user._id)
  }
  let products=await userHelpers.getWishProducts(user._id)
  res.render('user/wishlist',{products,user,cartCount})
})
// router.get('/add-to-wish',verifyLogin,(req,res)=>{
//   let user = req.session.user;
//   userHelpers.addToWish(req.params.id,user._id).then(()=>{
//     res.json({status:true})
//   })
// })
// router.get('/remove-wish/:id',verifyLogin,(req,res)=>{
//   let user=req.session.user
//   userHelpers.removeWish(req.params.id,user._id).then(()=>{
//     res.json({status:true})
//   })
// })
// router.post('/remove-wishProduct',(req,res)=>{
//   userHelpers.removeWishProduct(req.body).then((response)=>{
//     userHelpers.removeWish(req.session.user._id,req.body.product)
//     .then((response)=>{
//       res.json(response)
//     })
//   }) 
// })

router.get('/add-to-wish/:id',verifyLogin,async(req,res)=>{ 
  let userId=req.session.user._id;
  // let proId=req.query.id;
  let proId=req.params.id;
  userHelpers.addToWish(proId,userId).then(()=>{
  res.json({status:true})
  })
})

router.get('/remove-wishproduct/:id',verifyLogin,(req,res)=>{
  let user=req.session.user;
  userHelpers.removeWishProduct(req.params.id,user._id).then(()=>{
    res.json({status:true})
  })
}) 
router.get('/remove-wish/:id',verifyLogin,async(req,res)=>{
  let user=req.session.user
  let wishCount=await userHelpers.getWishCount(req.session.user._id)
  if(wishCount!=0){
    userHelpers.removeWish(req.params.id,user._id).then((response)=>{
      res.json(response)
    })
  }else{
    req.json()
  }
})

// router.post('/remove-wishProduct',(req,res)=>{
//   userHelpers.removeWishProduct(req.body).then((response)=>{
//     userHelpers.removeWish(req.session.user._id,req.body.product)
//     .then((response)=>{
//       res.json(response)
//     })
//   })
// })
// router.post('/remove-wish',(req,res)=>{
//   userHelpers.removeWish(req.body.product,req.session.user._id).then((result)=>{
//     productHelpers.removeWish(req.session.user._id,req.body.product)
//     .then((response)=>{
//       res.json(result)
//     })
//   })
// })

module.exports = router;