import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import amountWidget from './AmountWidget.js';

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
  }

  renderInMenu() {
    const thisProduct = this;
    const generatedHTML = templates.menuProduct(thisProduct.data);
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
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

    let price = thisProduct.data.price;

    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      for(let optionId in param.options) {
        const option = param.options[optionId],
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

    return productParams;
  }

  addToCart(){
    const thisProduct = this;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });
    thisProduct.element.dispatchEvent(event);

  }

  prepareCartProduct(){
    const thisProduct = this,
      productSummary = {};  
      
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.price;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }
}

export default Product;