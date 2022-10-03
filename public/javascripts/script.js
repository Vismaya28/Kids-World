


function addToCart(proId){
 
  $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>{
          if(response.status){
              let count=$('#cart-count').html()
              count=parseInt(count)+1
              $("#cart-count").html(count)
              location.reload()
          }
        
      }
    })
  }







  function changeStatus(orderId,status){
    console.log("vismaya patti",orderId,status)
     $.ajax({
    url:'/change-status',
    data:{
      orderId:orderId,
      newStatus:status
    },
    method:'POST',
    success:(response)=>{
        if(response.changeStatus){     
            location.reload()
        }
    }
  })

  }


  function changeQuantity(cartId,proId,userId,count){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
    $.ajax({
      url:'change-product-quantity',
      data:{
        user:userId,
        cart:cartId,
        product:proId,
        count:count,
        quantity:quantity
      },
      method:'post',
      success:(response)=>{
        if(response.removeProduct){
          location.reload()
        }else{
          document.getElementById(proId).innerHTML=quantity+count
          document.getElementById('total').innerHTML=response.total
          document.getElementById('totals').innerHTML=response.total
        }
      }
    })
  }
  

 