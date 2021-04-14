import {select, settings} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class amountWidget extends BaseWidget {
  constructor(element) {
    //super to odwolanie do konstruktora klasy nadrzednej BaseWidget
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    //console.log('AmountWidget', thisWidget);
    //console.log('constructor arguments', element);
    thisWidget.getElements(element);
    // musze zostawic ta linijke, inaczej po wczytaniu strony zostaje pusty input a w koszyku podczas zmiany ilosci zaczyna zmieniac od 1
    thisWidget.setValue(thisWidget.dom.input.value || settings.amountWidget.defaultValue);
    thisWidget.initActions();
  }

  getElements() {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  initActions() {
    const thisWidget = this;
    thisWidget.dom.input.addEventListener('change', function() {
      /*const inputValue = parseInt(thisWidget.dom.input.value);

      if (inputValue <= settings.amountWidget.defaultMin) {
        thisWidget.setValue(settings.amountWidget.defaultMin);
      }
      else if (inputValue >= settings.amountWidget.defaultMax) {
        thisWidget.setValue(settings.amountWidget.defaultMax);
      }
      else thisWidget.setValue(inputValue);*/
      thisWidget.value = thisWidget.dom.input.value;
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function(event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function(event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }

  isValid(value){
    return !isNaN(value)
    && value >= settings.amountWidget.defaultMin
    && value <= settings.amountWidget.defaultMax;
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }

}

export default amountWidget;