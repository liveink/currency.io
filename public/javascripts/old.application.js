/*

    TODO:
    - Add support for decimal places (up to 2)
    - Last synced

*/

Object.prototype.addClick = function(func){
  if (window.Touch){
    this.addEventListener('touchstart', function(e){
      e.preventDefault();
      this.className += ' pressed';
      this.moved = false;
      
      this.addEventListener('touchmove', function(e){ this.moved = true; }, false);
      
    }, false);
    
    this.addEventListener('touchend', function(e){
      e.preventDefault();
      if(!this.moved) func.call(this, e);
      this.removeEventListener('touchmove');
      
      this.className = this.className.replace(/\spressed/g, '');
    }, false);
    
  } else {
    this.addEventListener('click', func);
  }
}

var $ = function(q) { return document.querySelectorAll(q); };

var CurrencyConverter = {
  rate: 1,
  input: $('section#from h1')[0],
  output: $('section#to h1')[0],
  buttons: $('section#numpad p'),
  currencies: null,
  
  init: function() {
    this.draw_currencies();
    this.currencies = $('div#currencies span');
    
    for (var i = 0, ii = this.buttons.length - 1; i < ii; i++){
      this.buttons[i].addClick(function() {
        (function(targ) {
          this.input.innerHTML.match(/^0$/) && (this.input.innerHTML = '');
          this.update_values(this.input.innerHTML + targ.innerHTML);
        }).call(CurrencyConverter, this);
      });
    }
    
    this.buttons[this.buttons.length-1].addClick(function() {
      (function(targ) {
        if (!!this.input.innerHTML.match(/^0$/)) return;
        this.update_values(this.input.innerHTML.substr(0, this.input.innerHTML.length - 1));
      }).call(CurrencyConverter, this);
    });
    
    for (var i = 0, ii = this.currencies.length; i < ii; i++){
      this.currencies[i].addClick(function(e) {
        var lis = this.parentNode.parentNode.parentNode.childNodes,
            li = this.parentNode.parentNode;
        for (var i = 0, ii = lis.length; i < ii; i++) {
          if(!lis[i].className) continue;
          lis[i].className = lis[i].className.replace(/\s\bselected\b/g, '');
        }
        li.className += ' selected';
        
        window.from_to.from = $('ul#from-currency li.selected')[0].getAttribute('data-id');
        window.from_to.to = $('ul#to-currency li.selected')[0].getAttribute('data-id');
        localStorage.from_to = JSON.stringify(window.from_to);
        
        CurrencyConverter.update_currency_display();
      });
    }
    
    $('section#rates')[0].addClick(function(e) {
      $('body')[0].className = 'change-currencies';
    });
    
    $('a#save-currencies')[0].addClick(function(e) {
      $('body')[0].className = '';
    });
    
    if(!navigator.onLine) $('p#network-status')[0].className = 'offline';
    else CurrencyConverter.update_currencies();
    
    // Disable page scrolling
    //document.addEventListener('touchmove', function(e){ e.preventDefault(); });
  },
  
  update_currencies: function() {
    for (var id in window.currencies) {
      if(!window.currencies.hasOwnProperty(id)) continue;
      (function(id) {
        var r = new XMLHttpRequest();
        r.open('GET', '/exchange?from='+id, false);
        r.send(null);
        
        window.currencies[id].rate_usd = parseFloat(JSON.parse(r.responseText)['query']['results']['json']['rhs']);
      })(id);
    };

    localStorage.currencies = JSON.stringify(window.currencies);
    CurrencyConverter.update_currency_display();
  },
  
  update_currency_display: function() {
    var from_id = window.from_to.from,
        to_id = window.from_to.to,
        from = window.currencies[from_id],
        to = window.currencies[to_id],
        html = '';

    $("section#from h2")[0].innerHTML = from.symbol+' '+from.name;
    $("section#to h2")[0].innerHTML = to.symbol+' '+to.name;

    this.rate = from.rate_usd * (1 / to.rate_usd);

    html += '<em>'+from.symbol+'1.00</em>'+from_id;
    html += ' <span>&rarr;</span> ';
    html += to_id+'<em>'+to.symbol+(this.rate.toFixed(2))+'</em>';
    $('section#rates')[0].innerHTML = html;

    this.input.innerHTML = this.output.innerHTML = "0";
  },
  
  draw_currencies: function() {
    var currency_list = '',
        currencies = window.currencies;

    for(var id in currencies) {
      if(!window.currencies.hasOwnProperty(id)) continue;
      currency_list += '<li id="'+id+'" data-id="'+id+'">';
      currency_list += '<h1><span>'+currencies[id].symbol+' '+currencies[id].name+'</span></h1>';
      currency_list += '<h2>Synced: <strong>1 hour ago</strong></h2>';
      currency_list += '</li>';
    }
    
    $("ul#from-currency")[0].innerHTML = currency_list.replace(/\sid=\"([^\"]+)\"/g, ' id="from-$1"');
    $("ul#to-currency")[0].innerHTML = currency_list.replace(/\sid=\"([^\"]+)\"/g, ' id="to-$1"');
    
    $('ul#from-currency li#from-'+window.from_to.from)[0].className += ' selected';
    $('ul#to-currency li#to-'+window.from_to.to)[0].className += ' selected';
    
    this.update_currency_display();
  },
  
  update_values: function(value) {
    var value = this.strip_commas(value),
        output_value = (value * this.rate).toFixed();
    
    if(!value) value = 0;
    
    this.input.innerHTML = this.add_commas(value);
    this.output.innerHTML = this.add_commas(output_value);
  },
  
  add_commas: function(num) {
    var re = /(\d+)(\d{3,3})/;
    while (re.test(num)) {
      num = num.replace(re, '$1,$2');
    }
    return num;
  },
  
  strip_commas: function(num) {
    return num.replace(/,/g, '');
  }
  
}

CurrencyConverter.init();