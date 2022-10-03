var db=require('../config/connection')
var collection=require('../config/collection');
var ObjectId = require('mongodb').ObjectId
const { CATEGORY_COLLECTION } = require('../config/collection');
const bcrypt=require('bcrypt');
const moment= require('moment')


module.exports={
          adminLogin:(adminData)=>{
                    return new Promise(async(resolve,reject)=>{
                       let loginStatus=false
                       let response={}
                       if(admin){
                                 bcrypt.compare(adminData.password,admin.password).then((status)=>{
                                           if(status){
                                                  response.admin=admin
                                                  response.status=true
                                                  resolve(response)
                                           }else{
                                                  resolve({status:false})
                                           }
                                 })
                                
                       }else{
                                 resolve({status:false})
                       }   
                    })
          },

          monthlyReport:()=>{
            return new Promise(async(resolve,reject)=>{
                let today = new Date()
                let end = moment(today).format('YYYY/MM/DD')
                let start = moment(end).subtract(30,'days').format('YYYY/MM/DD')
                let orderShipped = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Shipped'}).toArray()
                let orderPlaced = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Placed'}).toArray()
                let orderPending = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Pending'}).toArray()
                let total = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
                let orderCancel = await db.get().collection(collection.ORDER_COLLECTION).find({status:'Cancelled'},{date:{$gte:start,$lte:end}}).toArray()
                let allUser = await db.get().collection(collection.USER_COLLECTION).find().toArray()
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                let razorpay = await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"Razorpay"}).toArray()
                let paypal = await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"Paypal"}).toArray()
                let cod = await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"COD"}).toArray()
                let deliveredOrder = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Delivered'}).toArray()
                let totalAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $group:{
                            _id:null,
                            total:{$sum:"$totalAmount"}
                        }
                    }
                ]).toArray()
    
                let paypalLength = paypal.length
                let razorpayLength = razorpay.length
                let codeLength = cod.length
                let allProducts = products.length
                let totalUsers = allUser.length
                let cancelTotal=orderCancel.length
                let orderSuccessLength = orderPlaced.length
                let orderTotalLength = total.length
                let orderFailLength = orderPending.length
                let totals = totalAmount[0]?.total
                let orderDeliveredLength = deliveredOrder.length
                let orderShippedLength=orderShipped.length
    
                var data = {
                    start:start,
                    end:end,
                    totalOrders:orderTotalLength,
                    successOrders:orderSuccessLength,
                    failedOrder:orderFailLength,
                    totalSales:totals,
                    cod:codeLength,
                    paypal:paypalLength,
                    razorpay:razorpayLength,
                    cancelOrder:cancelTotal,
                    allUser:totalUsers,
                    totalProducts:allProducts,
                    deliveredOrder:orderDeliveredLength,
                    shippedOrder:orderShippedLength
                }
                resolve(data)
    
            })
    
    
        },
        dateReport:(startDate,endDate)=>{
          return new Promise(async(resolve,reject)=>{
              
              
              let end= moment(endDate).format('YYYY/MM/DD')
              let start=moment(startDate).format('YYYY/MM/DD')
    
              
              let orderSuccess= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:{ $ne: 'pending',$ne:'Cancelled' }}).toArray()
              let orderPending= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status: 'pending'}).toArray()
              let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
              let cancelOrder=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Cancelled'}).toArray()
              let deliveredOrder=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Delivered'}).toArray()
              let allUser=await db.get().collection(collection.USER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
              let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
              let razorPay=await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"razorPay"}).toArray()
              let payPal=await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"payPal"}).toArray()
              let cod =await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"COD"}).toArray()
              let totalAmount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                  {
                    $group:{
                      _id:null,
                      total:{$sum:"$totalAmount"}
                    }
                  }
                ]).toArray()
                
               
                let payPalLength=payPal.length;
                let razorPayLength=razorPay.length;
                let codLength=cod.length;
              let allProducts=products.length;
              let totalUsers=allUser.length;
              let cancelTotal=cancelOrder.length
              let orderSuccessLength = orderSuccess.length
              let orderTotalLength = orderTotal.length
              let orderFailLength = orderPending.length;
              let total=totalAmount[0]?.total
              let orderDeliveredLength=deliveredOrder.length;
             
              var data = {
                 start: start,
                 end: end,
                 totalOrders: orderTotalLength,
                 successOrders: orderSuccessLength,
                 faildOrders: orderFailLength,
                 totalSales:total,
                 cod: codLength,
                 paypal: payPalLength,
                 razorpay: razorPayLength,
                 currentOrders: orderSuccess,
                 cancelOrder:cancelTotal,
                 allUser:totalUsers,
                 totalProducts:allProducts,
                 deliveredOrder:orderDeliveredLength
             }
         resolve(data)
        
         })
    
       },
          findCategory:(catName)=>{
            console.log("apple",catName);
              return new Promise((resolve,reject)=>{
               

                db.get().collection(collection.CATEGORY_COLLECTION).findOne({category_name:catName}).then((data)=>{
                 
                  resolve(data)
                })
                
              })
            },
            editCategory:(Id,data)=>{
              return new Promise((resolve,reject)=>{
                     
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:ObjectId(Id)},
                  {
                    $set:{
                      Category:data.Category
                    }
                  }).then((response)=>{
                         
                    resolve(response)
                  })
              })
            },
            categoryEdit:(id,data)=>{
              return new Promise((resolve,reject)=>{
                
                db.get().collection(collection.PRODUCT_COLLECTION).updateMany({Category:ObjectId(id) },{
                  $set:{
                  CategoryName:data.Category
                }
               }).then((response)=>{
                  resolve(response)
                 
                })
              })
            },
            addCategory:(product)=>{
              return new Promise((resolve,reject)=>{
                         db.get().collection(collection.CATEGORY_COLLECTION).insertOne(product)
                         resolve(true)
               }) 
      } ,
      // get-all-categorys
      getAllCategory:()=>{
               return new Promise(async(resolve,reject)=>{
                         let categorys=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
                        
                         resolve(categorys)
               })
      },
      deleteCategory:(proId)=>{
          return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:ObjectId(proId)}).then((response)=>{
              resolve(response)
              
            })
          })
        },
        allOrders:()=>{
          return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().sort({$natural:-1}).toArray()
           
            
            resolve(orders)
          })
        },
        updateStatus:(orderId,newStatus,cancelStatus,deliveryStatus)=>{
          return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
              $set:{
                status:newStatus,
                cancel:cancelStatus,
                delivery:deliveryStatus
              }
            }).then((response)=>{
              resolve(response)
            })
          })
        },
        addProductOffer:(data) => {
          // let end= moment(endDate).format('YYYY/MM/DD')
          return new Promise(async(resolve,reject)=>{
            data.endDate=moment(data.endDate).format('YYYY/MM/DD')
            data.startDate=moment(data.startDate).format('YYYY/MM/DD')
            
            
             let response={}
             let exist= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Description:data.product,offer: { $exists: true }});
             if(exist){
                 response.exist=true
                 resolve(response)
             }else{
              db.get().collection(collection.PRODUCT_OFFER).insertOne(data).then((res) => {
                  resolve(res)
              }).catch((err)=>{
                  reject(err)
              })
             }
          })
      
      },

        getAllproOffers:()=>{
          return new Promise(async(resolve,reject)=>{
            let proOffers=await db.get().collection(collection.PRODUCT_OFFER).find().sort({$natural:-1}).toArray()         
           resolve(proOffers)
          })
        },
        startProductOffer:(todayDate)=>{
          let proStartDate =  moment(todayDate).format('YYYY/MM/DD')
          
          return new Promise(async(resolve,reject)=>{
              let data= await db.get().collection(collection.PRODUCT_OFFER).find({startDate:{$lte:proStartDate}}).toArray();
              
              if(data){
                  await data.map(async(onedata)=>{
                      let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Description:onedata.product, offer: { $exists: false }})
                    //  console.log("s suh ",product);
                      if(product){
                       
                          let actualPrice =product.Price
                          let newP =(((product.Price) * (onedata.offerPer))/100)
                          let newPrice =actualPrice-newP;
        
                          newPrice=newPrice.toFixed()
                         
                         
                          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(product._id)},{
                              $set:{
                                  actualPrice: actualPrice,
                                  Price:newPrice,
                                  offer:true,
                                  offerPer:onedata.offerPer
                              }
                          })
                          resolve()
                      }else{
                          resolve()
                      }
        
                  })
        
              }else{
                  resolve()
              }
          })
        },
        deleteProOffer:(Id)=>{
          return new Promise(async(resolve,reject)=>{
          let proOffer=await db.get().collection(collection.PRODUCT_OFFER).findOne({_id:ObjectId(Id)})
          let proName=proOffer.product
         
          let Product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Description:proName})
          
          db.get().collection(collection.PRODUCT_OFFER).deleteOne({_id:ObjectId(Id)})
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({Description:proName},
            {
              $set:{
                Price:Product?.actualPrice
              },
              $unset:{
                actualPrice:"",
                offer:"",
                offerPer:""
              }
            }).then((response)=>{
              resolve(response)
            }).catch((err)=>{
              reject(err)
            })
          })
        },
        addCoupon:(data)=>{ 
          return new Promise(async(resolve,reject)=>{
             let startDate=moment(data.startDate).format('YYYY-MM-DD')
             let endDate= moment(data.endDate).format('YYYY-MM-DD')
            
              let dataobj = {
                 couponCode: data.couponCode,
                 offerPer: parseInt(data.offerPer),
                 startDate: startDate,
                 endDate: endDate,
                 Users: []
             }
             db.get().collection(collection.COUPON_COLLECTION).insertOne(dataobj).then(()=>{
                 resolve()
             }).catch((err)=>{
                 resolve(err)
             })
        
          })
        },

        getAllCoupons:()=>{
          return new Promise(async(resolve,reject)=>{
            let coupons=await db.get().collection(collection.COUPON_COLLECTION).find().sort({$natural:-1}).toArray()
    resolve(coupons)
  })
          
        },
        deleteCoupon:(Id)=>{
          return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:ObjectId(Id)}).then((response)=>{
              resolve(response)
            })
          })
        },
        startCouponOffers:(date)=>{
          let couponStartDate = moment(date).format('YYYY-MM-DD')
         return new Promise(async(resolve,reject)=>{
             let data= await db.get().collection(collection.COUPON_COLLECTION).find({$and:[{startDate:{$lte:couponStartDate}},{endDate:{$gte:couponStartDate}}]}).toArray()
             
             if(data.length >0){
                 await data.map((onedata)=>{
                     db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:ObjectId(onedata._id)},{
                       $set:{
                         available: true
                       }
                     }).then(()=>{
                         resolve()
                     })
                 })
             }else{
                 resolve()
             }
         })
        
        
        },

        }