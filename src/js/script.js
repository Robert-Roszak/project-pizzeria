/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
  // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
    // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  // CODE ADDED END
  };

  class Product{
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      //console.log('new product: ', thisProduct);
    }

    renderInMenu() {
      const thisProduct = this;
      // Generate html based on template
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // create element using utils.createElementFromHTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      // find menu container
      const menuContainer = document.querySelector(select.containerOf.menu);
      // add element to menu
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget () {
      const thisProduct = this;
      thisProduct.amountWidget = new amountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function() {
        thisProduct.processOrder();
      });
    }

    initAccordion () {
      const thisProduct = this;
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
        for (let activeProduct of activeProducts) {
          if (activeProduct != thisProduct.element) activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm () {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder () {
      const thisProduct = this,
        formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData: ', formData);
      let price = thisProduct.data.price;

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);
        for(let optionId in param.options) {
          const option = param.options[optionId],
            //console.log(optionId, option);
            imageParm = '.'+paramId+'-'+optionId,
            imageSelector = thisProduct.imageWrapper.querySelector(imageParm),
            optionSelected = formData[paramId].includes(optionId);

          if (imageSelector) {
            if (!optionSelected) imageSelector.classList.remove(classNames.menuProduct.imageVisible);
            else imageSelector.classList.add(classNames.menuProduct.imageVisible);
          }
          if (optionSelected) {
            if(!option.default) {
              price += option.price;
            }
          } else if (option.default) {
            price -= option.price;
          }
        }
      }
      //czy fragment z cena jednostkowa i cena calkowitka zrobilem wg zadania? mam wrazenie ze znalazlem inny sposob?
      //w prepareCartProduct moznaby zrobic productSummary.amount * productSummary.priceSingle ale to ciut dluzszy sposob (chyba)
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.price = price;
      thisProduct.priceElem.innerHTML = price;
    }

    prepareCartProductParams() {
      const thisProduct = this,
        formData = utils.serializeFormToObject(thisProduct.form),
        productParams = {};

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        productParams[paramId] = {
          label: param.label,
          options: {}
        };

        for(let optionId in param.options) {
          const optionSelected = formData[paramId].includes(optionId);
          const option = param.options[optionId];

          if (optionSelected) productParams[paramId].options[optionId] = option.label;
        }
      }
      console.log('productparams object issssssssssssssss?????: ', productParams);
      return productParams;
    }

    addToCart(){
      const thisProduct = this;
      //chyba dalej nie kumam, co to jest to "app" w app.cart.add? thisProduct.cart.add by nie dzialalo?
      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {};  
      //console.log('thisproduct.id to jestttttttttttttt: ',thisProduct.amountWidget.value);
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.price;
      productSummary.params = thisProduct.prepareCartProductParams();
      console.log('product summaryyyyyyyyy: ', productSummary);

      return productSummary;
    }

  }

  class amountWidget {
    constructor(element) {
      const thisWidget = this;
      //console.log('AmountWidget', thisWidget);
      //console.log('constructor arguments', element);
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    initActions() {
      const thisWidget = this;
      // dlaczego nie dzialalo w ten sposob? thisWidget.input.addEventListener('change', thisWidget.setValue(thisWidget.input.value));
      thisWidget.input.addEventListener('change', function() {
        const inputValue = parseInt(thisWidget.input.value);

        if (inputValue <= settings.amountWidget.defaultMin) {
          thisWidget.setValue(settings.amountWidget.defaultMin);
        }
        else if (inputValue >= settings.amountWidget.defaultMax) {
          thisWidget.setValue(settings.amountWidget.defaultMax);
        }
        else thisWidget.setValue(inputValue);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        if (thisWidget.value > settings.amountWidget.defaultMin) {
          thisWidget.value -= 1;
          thisWidget.setValue(thisWidget.value);
        }
        else thisWidget.setValue(thisWidget.value);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        if (thisWidget.value < settings.amountWidget.defaultMax) {
          thisWidget.value += 1;
          thisWidget.setValue(thisWidget.value);
        }
        else thisWidget.setValue(thisWidget.value);
      });
    }
    // jeszcze raz.. o co chodzi z tym announce? jak to dziala, ze przekazuje cene?
    announce() {
      const thisWidget = this;
      const event = new Event('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }

    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      /*console.log('value', value);
      console.log('newValue: ', newValue);
      console.log('thiswidget.value: ', thisWidget.value);
      console.log('thiswidget.input.value: ', thisWidget.input.value);*/

      // nie przekazuje mi ilosci sztuk do koszyka :( czy to w tym miejscu?

      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        thisWidget.value = newValue;
      }
      thisWidget.announce();
      thisWidget.input.value = thisWidget.value;
    }

  }

  class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new cart', thisCart);

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
      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        console.log('clicked order');
        thisCart.sendOrder();
      });
    }

    add(menuProduct){
      const thisCart = this;

      console.log('adding product: ', menuProduct);
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log('thisCart products: ', thisCart.products);
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
      // w dalszym ciagu jesli bezposrednio w koszyku zmniejszymy ilosc do 0, pojawia sie delivery fee, dlaczego?
      //thisCart.totalNumber zawsze rowna sie ilosci produktow podczas klikniecia add to cart
      if (thisCart.totalNumber !== 0) thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      else {
        thisCart.deliveryFee = 0;
        thisCart.totalPrice = 0;
      }
      
      console.log('thisCart.totalNumber: ', thisCart.totalNumber);
      /*console.log('thisCart.subtotalPrice: ', thisCart.subtotalPrice);
      console.log('thisCart.deliveryFee: ', thisCart.deliveryFee);
      console.log('thisCart.totalPrice: ', thisCart.totalPrice);*/
      thisCart.dom.deliveryWrapper.innerHTML = thisCart.deliveryFee;
      thisCart.dom.subtotalWrapper.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalNumberWrapper.innerHTML = thisCart.totalNumber;

      for (let singleWrapper of thisCart.dom.totalPriceWrappers) {
        singleWrapper.innerHTML = thisCart.totalPrice;
      }
    }

    remove (argument){
      const thisCart = this;
      //console.log('argument of remove: ', argument);
      const indexOfCart = thisCart.products.indexOf(argument);
      //console.log('indexOfCart: ', indexOfCart);
      thisCart.products.splice(indexOfCart, 1);
      //console.log('thisCart.products after remove: ', thisCart.products);
      // jak to sie dzieje, skad sie wzielo argument.dom.wrapper?
      argument.dom.wrapper.remove();
      thisCart.update();
    }

    sendOrder(){
      const thisCart = this;
      //const url = settings.db.url + '/' + settings.db.order;
      const payload = {};

      /* 
      products: tablica obecnych w koszyku produktów*/
      payload.address = thisCart.dom.addressWrapper.value;
      payload.phone = thisCart.dom.phoneWrapper.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = thisCart.deliveryFee;
      payload.products = {};

      console.log('wyslane do serwera: ', payload);

      for(let prod of thisCart.products) {
        payload.products.push(prod.getData()); //  payload.products.push is not a function
      }
    }
  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.productParams;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    initActions(){
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('clicked edit');
      });

      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        console.log('clicked remove');
        thisCartProduct.remove();
      });
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);

      console.log('thisCartProduct: ', thisCartProduct);
    }

    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new amountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function() {
        console.log('nacisniete ej');
        // thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    getData(){
      const thisCartProduct = this;
      //params jest puste?? :O
      console.log('thisCartProduct: ', thisCartProduct);
      //id, amount, price, priceSingle, name i params.
    }
    
  }

  const app = {
    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse: ', parsedResponse);

          // save parsedResponse as thisApp.data.products
          thisApp.data.products = parsedResponse;
          // execute initMenu method
          thisApp.initMenu();
        });

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
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    }
  };
  app.init();
}
