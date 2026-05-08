/**
 * EnnHealth — GA4 Conversion Event Tracking
 * Tracks: phone clicks, booking clicks, intake form starts
 */
(function(){
  'use strict';
  if(typeof gtag!=='function')return;

  // Track intake page as conversion
  if(location.pathname==='/intake'||location.pathname==='/intake.html'){
    gtag('event','intake_start',{event_category:'conversion'});
  }

  document.addEventListener('click',function(e){
    var a=e.target.closest('a');
    if(!a)return;
    var href=a.getAttribute('href')||'';

    // Phone clicks
    if(href.indexOf('tel:')===0){
      gtag('event','phone_click',{event_category:'conversion',event_label:href});
    }
    // Booking clicks
    else if(href.indexOf('#book')!==-1||href.indexOf('Book')!==-1||a.classList.contains('nav-cta')){
      gtag('event','book_appointment',{event_category:'conversion',event_label:href});
    }
    // Intake link clicks (from other pages)
    else if(href.indexOf('/intake')!==-1){
      gtag('event','intake_click',{event_category:'conversion',event_label:href});
    }
  });
})();
