import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import amountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(bookingWrapper){
    const thisBooking = this;
    const bookedTableId = ''; // eslint-disable-line no-unused-vars
    thisBooking.render(bookingWrapper);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,      
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,      
      ],
    };
    //console.log(params);
    //na filmie instruktor pisze kilka lini w tym samym czasie, jak to zrobic? :)
    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    //console.log(urls);
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }  

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat){
      if (item.repeat == 'daily'){
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        } 
      } 
    }
    thisBooking.updateDOM();
    //console.log('thisBooking.booked: ', thisBooking.booked);
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      //console.log('loop: ', hourBlock);
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }
    
    for (let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      // remove class selected on change of date or time
      if (table.classList.contains(classNames.booking.selected)) table.classList.remove(classNames.booking.selected);

      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector(select.containerOf.tables);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.addressWrapper = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.phoneWrapper = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.startersWrapper = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    //console.log('thisBooking.dom.startersWrapper: ', thisBooking.dom.startersWrapper);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new amountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new amountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    /*thisBooking.dom.peopleAmount.addEventListener('click', function() {
      console.log('kliknieto w ilosc ludzi');
    });

    thisBooking.dom.hoursAmount.addEventListener('click', function() {
      console.log('kliknieto w godziny');
    });*/

    thisBooking.dom.tablesWrapper.addEventListener('click', function(event) {
      // chyba w jakis pokretny sposob wyslalem klikniety element?
      thisBooking.bookTable(event.path[0]);
    });

    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();

    });
  }

  bookTable(clickedTable){
    const thisBooking = this;
    const bookedTable = clickedTable.classList.contains(classNames.booking.tableBooked);
    const selectedTable = clickedTable.classList.contains(classNames.booking.selected);    
    thisBooking.bookedTableId = '';

    if (clickedTable) clickedTable.classList.remove(classNames.booking.selected);

    if (clickedTable.classList.contains('table')) {
      if (!bookedTable && !selectedTable) {
        clickedTable.classList.add(classNames.booking.selected);
        thisBooking.bookedTableId = clickedTable.getAttribute(settings.booking.tableIdAttribute);
      }
      else if (bookedTable) alert('Wybrano zajęty stolik');
    }
    //console.log('tableId wybranego stolika: ', thisBooking.bookedTableId);
  }

  sendBooking(){
    const thisBooking = this;
    const payload = {};
    const url = settings.db.url + '/' + settings.db.booking;

    payload.date = thisBooking.datePicker.correctValue;
    payload.hour = thisBooking.hourPicker.correctValue;
    payload.table = parseInt(thisBooking.bookedTableId);
    payload.duration = parseInt(thisBooking.hoursAmount.correctValue);
    payload.ppl = parseInt(thisBooking.peopleAmount.correctValue);
    payload.phone = thisBooking.dom.phoneWrapper.value;
    payload.address = thisBooking.dom.addressWrapper.value;
    payload.starters = [];

    for (const starter of thisBooking.dom.startersWrapper){
      if (starter.checked) {
        const starterName = starter.getAttribute('value');
        payload.starters.push(starterName);
      }
    }

    //console.log('payload: ', payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    
    if (isNaN(payload.table) || payload.phone === '' || payload.address === ''){
      alert('Proszę uzupełnić formularz przed wysłaniem rezerwacji');
    }
    else {      
      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){ // eslint-disable-line no-unused-vars
          //console.log('parsedResponse: ', parsedResponse);
          thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
          thisBooking.updateDOM();
          alert('Zarezerwowano stolik numer ' + payload.table + ' na datę ' + payload.date + ', na ' + payload.duration + ' godzin, ilość osób ' + payload.ppl+ '. Zamówione przystawki to: ' + payload.starters);
        });
    }
  }
}

export default Booking;