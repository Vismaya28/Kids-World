var db=require('../config/connection')
var collection=require('../config/collection');
const { ObjectID } = require('bson');
const { CATEGORY_COLLECTION } = require('../config/collection');
const { response } = require('../app');
const { brotliDecompress } = require('zlib');
const { FeedbackContext } = require('twilio/lib/rest/api/v2010/account/call/feedback');
const { resolve } = require('path');
var ObjectId=require('mongodb').ObjectId
module.exports={
    addProduct:(data,products,callback)=>{
        console.log(products);
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(
            { 
                Name:products.name,
                category_name:data.category_name,
                Price:parseInt(products.Price), 
                Description:products.Description
            }

        ).then((data)=>{
            console.log(data);
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
      return new Promise(async(resolve,reject)=>{
          let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
          resolve(products)
        
      })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:ObjectId(proId)}).then((response)=>{
               console.log(response);
                resolve(response)
            })
        })
        
    },

    addImages:(id,productImg)=>{
    return new Promise((resolve,reject)=>{ 
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:id},{
            $push:{
                productImages:productImg
            }
        }).then((response)=>{
            resolve(response)
        })
    })
    },
     getProductDetails:(proId)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((product)=>{
                 resolve(product)
             })
         })
     },
     updateProduct:(proId,proDetails)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectID(proId),
                $set:{
                    
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    category:proDetails.category_name
                }
            }).then((response)=>{
                resolve()
            })
         })
     },
     findProduct:(proId)=>{
        return new Promise(async(resolve,reject)=>{
         let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)})
         resolve(product)
        
        })
      },

     getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users) 
          
        })
    },

    
    getUserDetails:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)}).then((user)=>{
                resolve(user)
            })
        })
    },
    updateUser:(userId,userDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $set:{
                    Name:userDetails.Name,
                    Email:userDetails.Email    
                }
            }).then((response)=>{
                resolve()
            
        })
       })
    },
    addBanner:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_COLLECTION).insertOne(data).then((response)=>{
                resolve(response.insertedId)
            })
        })

    },
    getAllBanner:()=>{
        return new Promise(async(resolve,reject)=>{
            let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banners)
        })
    },
    deleteBanner:(Id)=>{
        return new Promise((resolve,reject)=>{
     db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:ObjectId(Id)}).then((response)=>{
        resolve(response)
     })
        })
    },
    handleWishlist:(wishlist,products)=>{
        return new Promise((resolve,reject)=>{
            if(wishlist?.products){
                wishlist=wishlist.products.map((product)=>product.item.toString())
                products.forEach((product)=>{
                    if(wishlist.includes(product._id,toString())){
                        product.wish=true;
                    }
                })
            } 
            resolve(products)
        })
    },
    removeWish:(userId,proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({'wishUser.usreId':ObjectID(userId)}, 
            {
                $set:{
                    wishList:false
                }
            }
            ).then((reponse)=>{
                resolve(response)
            })
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:ObjectID(proId)},
            
            {
                $pull:{wishUser:{userId:ObjectID(userId)}}
            }).then((reponse)=>{
                resolve(response)
            })
        })
    }
      
      
}
    
   
