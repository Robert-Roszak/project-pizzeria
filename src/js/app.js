import {settings, select, classNames, templates} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {
  initData: function(){
    const thisApp = this,
      url = settings.db.url + '/' + settings.db.product;

    thisApp.data = {};

    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        console.log('parsedResponse: ', parsedResponse);
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });

    //zwraca pusty obiekt?
    console.log('thisApp.data ', JSON.stringify(thisApp.data));
  },

  initMenu: function(){
    const thisApp = this;
    console.log('thisappdata: ', thisApp.data);

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  init: function(){
    const thisApp = this;
    console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates);
    thisApp.initData();
    //thisApp.initMenu();
    thisApp.initCart();
  },

  initCart: function(){
    const thisApp = this,
      cartElem = document.querySelector(select.containerOf.cart);

    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  }
};

app.init();
