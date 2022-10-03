var db=require('../config/connection')
var collection=require('../config/collection')
const moment= require('moment')

var ObjectId = require('mongodb').ObjectId
const bcrypt=require('bcrypt')
const { response } = require('../app')
const { resolve } = require('path')
const Razorpay=require('razorpay')
const { resolveObjectURL } = require('buffer')
const { resolveCaa } = require('dns')
const { ObjectID } = require('bson')
var instance = new Razorpay({
  key_id:'rzp_test_FtYHG5tZK4sqFj',
  key_secret:'fvyp7RLAKHjIiTVdqBdmqj7Y'
})

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            userData.password2=await bcrypt.hash(userData.password2,10)
             userData.status = true
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.insertedId)
                console.log(data);
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
          let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
          if(user){
              bcrypt.compare(userData.password,user.password).then((status)=>{
                  if(status){
                      console.log("login success");
                      response.user=user
                      response.status=true
                      resolve(response)
                  }
                  else{
                      console.log("login failed");
                      resolve({status:false})
                  }
             })
          }
          else{
              console.log('login failed');
              resolve({status:false})
          }
        })
    },
    
      blockUser: (userId) =>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
          {
            $set:{
              status:false
            }
          }).then((response)=>{
            resolve(response)
          })
        })
      },
            
    
     
      unBlockUser: (userId) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) },
              {
                $set: {
                  status: true,
                },
              }
            )
            .then(() => {
              resolve(true);
            });
        });
      },
    
     
      findUser: (num) => {

        return new Promise((resolve, reject) => {
          console.log("find user");
          db.get()
            .collection(collection.USER_COLLECTION)
            .findOne({ number: num })
            .then((response) => {
              resolve(response);
              console.log("response of otp",response);
            }); 
        });
      },
      addToCart:(proId,userId)=>{
        let proObj={
          item:ObjectId(proId),
          quantity:1
          
        }
        return new Promise(async(resolve,reject)=>{
          let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user: ObjectId(userId)})
          if(userCart){
            let proExist=userCart.products.findIndex(product=> product.item==proId)
            console.log(proExist);
            if(proExist !=-1){
               db.get().collection(collection.CART_COLLECTION)
               .updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
               
               {
                 $inc:{'products.$.quantity':1}
               }
               ).then(()=>{
                 resolve()
               })
            }else{
              db.get().collection(collection.CART_COLLECTION)
              .updateOne({user:ObjectId(userId)},
              {
              
                  $push:{products:proObj}
                 
              }
              ).then((response)=>{
                resolve()
              })
              .catch((err)=>{
                console.log(err);
              })
            }
          }else{
            let cartObj={
              user:ObjectId(userId),
              products:[proObj],
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
              resolve()
            }).catch((err)=>{
              console.log(err);
            })
          }
        })
      },
      getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
              $match:{user:ObjectId(userId)}
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
              
          ]).toArray()
          console.log('cart');
          console.log(cartItems);
          resolve(cartItems)
        })
      },
      getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let count=0
          let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
           if(cart){
             count=cart.products.length
           }
           resolve(count)
        })
      },
      changeProductQuantity:(details)=>{
        count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
          if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:ObjectId(details.cart)},
            {
              $pull:{products:{item:ObjectId(details.products)}},
            }).then((response)=>{
              resolve({removeProduct:true})
            })
          }else{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
            {
              $inc:{'products.$.quantity':count}
            }
            
            ).then((response)=>{
              // resolve({status:true})
              resolve(response)
            })
          } 
        })
      },
      removeCartProduct: (details) => {
        console.log("remooove",details);
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { _id: ObjectId(details.cart) },
              {
                $pull: { products: { item: ObjectId(details.product) } },
              }
            )
            .then((response) => {
              resolve({ removeProduct: true });
            });
        });
      },
      getTotalAmount:(userId)=>{
        console.log("Total",userId);
        return new Promise(async(resolve,reject)=>{
          let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
              $match: { user: ObjectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: [
                      { $toInt: "$quantity" },
                      { $toInt: "$product.Price" },
                    ]
                  }
                }
              }
            }
            ]).toArray()
          
      //  console.log(total[0]?.total);
          
          resolve(total[0]?.total)
          // console.log(total)
          // resolve(total) 
          

        })
      },
      placeOrder:(order,products,total)=>{
        let today=new Date()
        let date=moment(today).format('YYYY/MM/DD')
        // console.log("placee",order,products,total);
        console.log('orderrr');
        return new Promise((resolve,reject)=>{
             console.log(order,products,total);
             let status=order['payment-method']==='COD'?'placed':'pending'
             let orderObj={
               deliveryDetails:{
                name:order.fname,
                houseName:order.houseName,
                city:order.city,
                pincode:order.pincode,
                mobile:order.mobile
               },
               userId:ObjectId(order.userId),
               paymentMethod:order['payment-method'],   
               products:products,
               status:status,
               totalAmount:total,
               date:date
             }

             db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
              db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)}) 
               console.log("order",orderObj);
              //  resolve(response.ops[0]._id) 
              resolve(response.insertedId)
             })
        })

      },
      getCartProductList:(userId)=>{ 
        return new Promise(async(resolve,reject)=>{
          console.log(userId);
          
          let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
          console.log(cart)
          resolve(cart.product)
        })
      },
      getOrderProducts:(ordrId)=>{
        return new Promise(async(resolve,reject)=>{
          let orderProducts=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match:{
                _id:ObjectId(ordrId)
              }
            },
            {
              $unwind:"$products"
            },
            {
              $project:{
                item:"$products.item",
                quantity:"$products.quantity"
              }
            },
            {
              $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'products'
              }
            },
            {
               $project:{
                 item:1,quantity:1,products:{$arrayElemAt:['$products',0]}
               }
            }
          ]).toArray()
          
          resolve(orderProducts)
        })
      },
      // editProfile: (userId, UserData) => {
      //   return new Promise((resolve, reject) => {
      //     db.get()
      //       .collection(collection.USER_COLLECTION)
      //       .updateOne(
      //         { _id: ObjectId(userId) },
      //         {
      //           $set: {
      //             // Name: UserData.Name,
      //             // Email: UserData.Email,
      //             // PhoneNumber: UserData.PhoneNumber,
      //             fname:UserData.fname,
      //             email: UserData.email,
      //             number: UserData.number,
                 
      //           },
      //         }
      //       )
      //       .then((response) => {
      //         resolve(response);
      //       });
      //   });
      // },

    cancelOrder:(orderId)=>{
    return new Promise((reject,resolve)=>{
      db.get().collection(collection.ORDER_COLLECTION).deleteOne({id:ObjectId(Id)}).then((response)=>{
        resolve(response)
      })
    })
    },
      getUserDetails:(userId)=>{
       return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)}).then((userDetails)=>{
          resolve(userDetails)
        })
       })
      },
       
      updateProfile:(userId,userData)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION)
         .updateOne({_id:ObjectId(userId)},{
          $set:{
            Name:userData.fname,
            Email:userData.email,
            Number:userData.number

          }
         }).then((response)=>{
          resolve(response)
         })
        })
      },


      addAddress: (userId, data) => {
        return new Promise(async (resolve, reject) => {
          let user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: ObjectId(userId) });
          
          if (user) {
            data._id = ObjectId();
            if (user.address) {
              db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: ObjectId(userId) },
                  {
                    $push: { address: data },
                  }
                )
                .then((response) => {
                  resolve(response);
                })
                .catch((err) => {
                  resolve(err);
                });
            } else {
              let add = [data];
              db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: ObjectId(userId) },
                  {
                    $set: {
                      address: add,
                    },
                  }
                )
                .then((response) => {
                  resolve(response);
                })
                .catch((err) => {
                  resolve(err);
                });
            }
          }
        });
      },
      
      deleteAddress:(userId)=>{
         return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION).deleteOne({_id:ObjectId(Id)}).then((response)=>{
            resolve(response)
          })
         })
      },



      getAllAddress:(userId)=>{
return new Promise(async(resolve,reject)=>{
  let user = await db.get().collection(collection.USER_COLLECTION)
  .findOne({_id:ObjectId(userId)})
  resolve(user.address)
})
      },
     findAddress:(userId,addId)=>{
  return new Promise(async(resolve,reject)=>{
    let address=await db.get().collection(collection.USER_COLLECTION)
    .aggregate([
      {
        $match:{
          _id:ObjectId(userId),
        },
      },
      {
        $unwind:"$address",
      },
      {
        $match:{
          "address._id":ObjectId(addId),
        },
      },
      {
        $project:{
          _id:0,
          address:1,
        },
      },
    ])
    .toArray()
    resolve(address[0]?.address)
  })
     },
     deleteAddress:(userId,data)=>{

      return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne(
          {
            _id:ObjectId(userId)
          },
          {
            $pull:{address:{_id:ObjectId(data)}},
          }
        )
        .then((response)=>{
          resolve(response)
        })
        .catch((err)=>{
          resolve(err)
        })
      })

     },
    //  editAddress: (userId, data) => {
    //   return new Promise((resolve, reject) => {
    //     db.get()
    //       .collection(collection.USER_COLLECTION)
    //       .updateOne(
    //         { _id: ObjectId(userId), "address._id": ObjectId(data.addId) },
    //         {
    //           $set: {
    //             "address.$.name": data.name,
    //             "address.$.houseName": data.houseName,
    //             "address.$.city": data.city,
    //             "address.$.pinCode": data.pinCode,
    //             "address.$.phoneNumber": data.phoneNumber,
    //           },
    //         }
    //       )
    //       .then((response) => {
    //         resolve(response);
    //       })
    //       .catch((err) => {
    //         resolve(err);
    //       });
    //   });
    // },

      passwordMatch: (oldPassword, userId) => {
        return new Promise(async (resolve, reject) => {
          let user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: ObjectId(userId) });
          if (user) {
            bcrypt.compare(oldPassword, user.password).then((response) => {
              resolve(response);
            });
          }
        });
      },
      // change-password
      updatePassword: (newPassword, userId) => {
        return new Promise(async (resolve, reject) => {
          newPassword = await bcrypt.hash(newPassword, 10);
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
    
              {
                $set: {
                  password: newPassword,
                },
              }
            )
            .then((response) => {
              resolve(response);
            });
        });
      },
      getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          console.log(userId);
          let orders=await db.get().collection(collection.ORDER_COLLECTION)
          .find({userId:ObjectId(userId)}).toArray()
          console.log(orders)
          resolve(orders)
          console.log("get orders");
        })
      },
      generateRazorpay:(orderId,totalPrice)=>{
        return new Promise((resolve,reject)=>{
         var options={
          amount:totalPrice*100,
          currency:"INR",
          receipt: ""+orderId
         }
         instance.orders.create(options,function(err,order){
          if(err){
            console.log(err);
          }else{

          
          console.log("new order",order);
          resolve(order)
          }
         })
        })
      },
      changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.ORDER_COLLECTION)
          .updateOne({_id:ObjectId(orderId)},
          {
            $set:{
              status:"Placed"
            }
          }
          ).then(()=>{
            resolve()
          }).catch((err)=>{
            resolve(err)
          })
        })
      },
      
    
     
      couponValidate:(data,userId)=>{
        
    
          return new Promise(async(resolve,reject)=>{
              obj = {}
                  let date=new Date()
                  date=moment(date).format('YYYY-MM-DD')
                  let coupon= await db.get().collection(collection.COUPON_COLLECTION).findOne({couponCode:data.couponCode})
                 
                  if(coupon){
                    let couponId=coupon._id
                          let users = coupon.Users
                          let userChecker = users.includes(userId)
                          if(userChecker){
                            
                              obj.couponUsed=true;
                              resolve(obj)
                          }else{
                            
                              if(date <= coupon.endDate){
                                  let total = parseInt(data.total)
                                  let percentage = parseInt(coupon.offerPer)
                                  let discountVal = ((total * percentage) / 100).toFixed()
                                  obj.total = total - discountVal
                                  obj.oldTotal=total
                                  obj.success = true
                                  obj.couponId=couponId
                                    resolve(obj)
                                  
                                  
                                 
                              }else{
                                  obj.couponExpired = true
                                    
                                     resolve(obj)
                              }
                          }
                      }else{
                          obj.invalidCoupon = true
                          
                          resolve(obj)
      
                      }   
               })
          },
         couponAddressAdd:(userId,Id)=>{
          return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:ObjectId(Id)},
            {
              $push:{User:userId}
            }
            ).then((result)=>{
              resolve(result)
            })
          })
         },
         
         
       addToWish:(proId,userId)=>{
        let proObj={
          item:ObjectId(proId),
          quantity:1,
        }
        return new Promise(async(resolve,reject)=>{
          let userWish=await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:ObjectId(userId)})
          if(userWish){
            let proExist=userWish.products.findIndex(product=>product.item==proId)
            if(proExist!=-1){
              db.get().collection(collection.WISHLIST_COLLECTION)
              .updateOne({_id:ObjectId(userId)},
              {
                $pull:{products:{item:ObjectId(proId)}}
              }
              ).then(()=>{
                resolve()
              })
            }else{
              db.get().collection(collection.WISHLIST_COLLECTION)
              .updateOne({userId:ObjectId(userId)},
              {
                $push:{products:proObj}
              }
              ).then((response)=>{
                resolve(response)
              })
            }
          }else{
            let wishObj={
              user:ObjectId(userId),
              products:[proObj],
            }
            db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response)=>{
              resolve(response)
            })
          }
        })
       },
       getWishProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let wishItems=await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
            {
              $match:{user:ObjectId(userId)}
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
          ]).toArray()
          resolve(wishItems)
        })
       },

       removeWish:(proId,userId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            {user: ObjectId(userId)},
            {$pull:{products:{item:ObjectId(proId)}}}
          )
          .then((response)=>{
            resolve({removeProduct:true})
          })
        })
       },
       getWish:(userId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:ObjectId(userId)}).then((output)=>{
            resolve(output)
          })
        })
       },
       getWishCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let count = 0
          let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:ObjectId(userId)})
          if(wish){
            count = wish.products.length
          }
          resolve(count)
        })
       },
      //  removeWishProduct:(details)=>{
      //   return new Promise((resolve,reject)=>{
      //     db.get().collection(collection.WISHLIST_COLLECTION)
      //     .updateOne(
      //       {_id:ObjectId(details.wish)},
      //       {
      //         $pull:{wishList:{item: ObjectId(details.product)}},
      //       }
      //     )
      //     .then((response)=>{
      //       resolve({removeProduct:true})
      //     })
      //   })
      //  }

    removeWishProduct:(proId,userId)=>{
      return new Promise((resolve,reject=>{
        db.get().collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          {user:ObjectId(userId)},
          {$pull:{products:{item:ObjectId(proId)}}}
        )
        .then(()=>{
          resolve(response)
        }).catch((err)=>{
          reject(err)
        })
      }))
    },

    addToWallet:(userId,amount)=>{
      return new Promise((resolve,reject)=>{
        amount=parseInt(amount)
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
        {
          $inc:{wallet:amount}
        }).then((response)=>{
          resolve(response)
        }).catch((err)=>{
          resolve(err)
        })
      })
    },
    applyWallet:(user,details)=>{
      return new Promise((resolve,reject)=>{
        let obj={}
        if(details.applyWallet>user.wallet){
          obj.noBalance=true
          resolve(obj)
        }else{
          obj.success=true
          resolve(obj)
        }
      })
    },
    findUserWallet:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectID(userId)})
        resolve(user)
      })
    },
    walletChange:(userId,amount)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectID(userId)},
        {
          $inc:{wallet:-amount}
        }).then((response)=>{
          obj.success=true
          resolve(obj)
        }).catch((err)=>{
          resolve(err)
        })
      })
    }
        }


