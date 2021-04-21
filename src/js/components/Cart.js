import {select, classNames, templates, settings} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();
    //console.log('new cart', thisCart);
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryWrapper = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalWrapper = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPriceWrappers = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumberWrapper = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phoneWrapper = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.addressWrapper = thisCart.dom.wrapper.querySelector(select.cart.address);
  }

  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct){
    const thisCart = this,
      generatedHTML = templates.cartProduct(menuProduct),
      generatedDOM = utils.createDOMFromHTML(generatedHTML);

    //console.log('adding product: ', menuProduct);
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    //console.log('thisCart products: ', thisCart.products);
    thisCart.update();
  }

  update(){
    const thisCart = this;
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }

    if (thisCart.totalNumber !== 0) thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    else {
      thisCart.deliveryFee = 0;
      thisCart.totalPrice = 0;
    }

    thisCart.dom.deliveryWrapper.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subtotalWrapper.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalNumberWrapper.innerHTML = thisCart.totalNumber;

    for (let singleWrapper of thisCart.dom.totalPriceWrappers) singleWrapper.innerHTML = thisCart.totalPrice;
  }

  remove (argument){
    const thisCart = this,
      indexOfCart = thisCart.products.indexOf(argument);

    thisCart.products.splice(indexOfCart, 1);
    argument.dom.wrapper.remove();
    thisCart.update();
  }

  sendOrder(){
    const thisCart = this,
      url = settings.db.url + '/' + settings.db.order,
      payload = {};
 
    payload.address = thisCart.dom.addressWrapper.value;
    payload.phone = thisCart.dom.phoneWrapper.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = thisCart.deliveryFee;
    payload.products = [];

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    //console.log('wyslane do serwera: ', payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
      
    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){ // eslint-disable-line no-unused-vars
        //console.log('parsedResponse: ', parsedResponse);
      });
  }
}

export default Cart;