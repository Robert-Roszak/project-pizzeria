/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
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
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
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
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }
  }

  class amountWidget {
    constructor(element) {
      const thisWidget = this;
      console.log('AmountWidget', thisWidget);
      console.log('constructor arguments', element);
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
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }

    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      console.log('value value', value);
      console.log('newValue value: ', newValue);

      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        thisWidget.value = newValue;
      }
      thisWidget.announce();
      thisWidget.input.value = thisWidget.value;
    }

  }

  const app = {
    initData: function(){
      const thisApp = this;

      thisApp.data = dataSource;
    },

    initMenu: function(){
      const thisApp = this;
      console.log('thisappdata: ', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
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
      thisApp.initMenu();
    },
  };
  app.init();
}
