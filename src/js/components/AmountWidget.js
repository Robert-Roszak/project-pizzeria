import {select, settings} from '../settings.js';

class amountWidget {
  constructor(element) {
    const thisWidget = this;
    //console.log('AmountWidget', thisWidget);
    //console.log('constructor arguments', element);
    thisWidget.getElements(element);
    thisWidget.setValue(thisWidget.input.value || settings.amountWidget.defaultValue);
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
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.linkIncrease.addEventListener('click', function(event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }

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

    if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
      thisWidget.value = newValue;
    }
    thisWidget.announce();
    thisWidget.input.value = thisWidget.value;
  }
}

export default amountWidget;