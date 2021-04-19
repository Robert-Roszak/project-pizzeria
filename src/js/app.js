import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';


const app = {

  initPages: function(){
    const thisApp = this;
    const idFromHash = window.location.hash.replace('#/', '');

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages){
      if (page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);
    for (let link of thisApp.navLinks){

      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();
        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);
        window.location.hash = '#/' + id;
      });
    }
  },

  activatePage: function(pageId){
    const thisApp = this;

    for (let page of thisApp.pages){
      //console.log('page.id: ',page.id);
      //console.log('pageId: ',pageId);
      //console.log('page: ',page);
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    for (let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },


  initData: function(){
    const thisApp = this,
      url = settings.db.url + '/' + settings.db.product;

    thisApp.data = {};

    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        //console.log('parsedResponse: ', parsedResponse);
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
    //pusty obiekt?
    //console.log('thisApp.data ', JSON.stringify(thisApp.data));
  },

  initMenu: function(){
    const thisApp = this;
    //console.log('thisappdata: ', thisApp.data);

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  init: function(){
    const thisApp = this;
    /*console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates);*/
    thisApp.initPages();
    thisApp.initData();
    //thisApp.initMenu();
    thisApp.initCart();
    thisApp.initBooking();
    thisApp.initHome();
  },

  initCart: function(){
    const thisApp = this,
      cartElem = document.querySelector(select.containerOf.cart);

    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },

  initBooking: function(){
    const thisApp = this,  // eslint-disable-line no-unused-vars
      bookingWrapper = document.querySelector(select.containerOf.booking);
    new Booking(bookingWrapper);
  },

  initHome: function(){
    const thisApp = this,
      orderWrapper = document.querySelector(select.home.order),
      bookingWrapper = document.querySelector(select.home.booking);

    orderWrapper.addEventListener('click', function(){
      thisApp.activatePage('order');
    });

    bookingWrapper.addEventListener('click', function(){
      thisApp.activatePage('booking');
    });

    var elem = document.querySelector('.main-carousel');
    new Flickity( elem, { // eslint-disable-line no-undef
    // options
      wrapAround: true,
      autoPlay: true,
      prevNextButtons: false,
      dragThreshold: 40,
      cellAlign: 'left',
      contain: true
    });
  }
};

app.init();
