    // ─── SECURITY: HTML escape to prevent XSS ───
    function esc(str) {
      if (str == null) return '';
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(String(str)));
      return div.innerHTML;
    }

    // ─── RATE LIMITING ───
    // Prevents rapid-fire submissions on booking, eligibility, and form endpoints
    var _rateLimits = {};
    function rateLimited(key, cooldownMs) {
      var now = Date.now();
      if (_rateLimits[key] && now - _rateLimits[key] < cooldownMs) return true;
      _rateLimits[key] = now;
      return false;
    }

    // ─── CUSTOM BOOKING CALENDAR ───
    // Google Apps Script Web App URL — handles availability + booking
    // After deploying the Apps Script, paste the web app URL here:
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz64vu0wcwGn1DPQB2SBpssuA03m_OZdZg8K6sv904ETw6gnoqofXguXycUIMJOKJ_34A/exec';

    // Booking state
    var bookingState = {
      step: 1,
      apptType: null,
      apptDuration: null,
      selectedDate: null,
      selectedTime: null,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear()
    };

    // Default office hours (fallback if API fetch fails)
    // Keep in sync with admin panel settings
    var DEFAULT_OFFICE_HOURS = {
      0: null,                     // Sun — closed
      1: { start: 9, end: 22 },   // Mon 9AM-10PM
      2: { start: 10, end: 22 },  // Tue 10AM-10PM
      3: null,                     // Wed — closed
      4: { start: 9, end: 22 },   // Thu 9AM-10PM
      5: { start: 9, end: 22 },   // Fri 9AM-10PM
      6: { start: 9, end: 22 }    // Sat 9AM-10PM
    };
    var OFFICE_HOURS = JSON.parse(JSON.stringify(DEFAULT_OFFICE_HOURS));

    // Fetch dynamic office hours from backend (admin-configurable)
    // Returns a promise so hero + calendar can wait for it
    var officeHoursReady = (function loadOfficeHours() {
      if (!APPS_SCRIPT_URL) return Promise.resolve();
      return fetch(APPS_SCRIPT_URL + '?action=getOfficeHours')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.hours) {
            for (var d = 0; d <= 6; d++) {
              var val = data.hours[String(d)];
              OFFICE_HOURS[d] = val ? { start: Number(val.start), end: Number(val.end) } : null;
            }
          }
        })
        .catch(function() { /* defaults remain */ });
    })();

    // Generate available time slots for a date
    function getTimeSlotsForDate(date) {
      var day = date.getDay();
      var hours = OFFICE_HOURS[day];
      if (!hours) return [];
      var slots = [];
      var duration = bookingState.apptDuration || 30;
      for (var h = hours.start; h < hours.end; h++) {
        for (var m = 0; m < 60; m += 30) {
          if (h + (m + duration) / 60 > hours.end) break;
          var hour12 = h > 12 ? h - 12 : h;
          if (hour12 === 0) hour12 = 12;
          var ampm = h >= 12 ? 'PM' : 'AM';
          var minStr = m < 10 ? '0' + m : '' + m;
          slots.push({
            time24: (h < 10 ? '0' + h : h) + ':' + minStr,
            label: hour12 + ':' + minStr + ' ' + ampm
          });
        }
      }
      return slots;
    }

    // Fetch busy times from Apps Script (if configured)
    function fetchBusyTimes(dateStr, callback) {
      if (!APPS_SCRIPT_URL) { callback([]); return; }
      var url = APPS_SCRIPT_URL + '?action=availability&date=' + dateStr;
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) { callback(data.busyTimes || []); })
        .catch(function() { callback([]); });
    }

    // Select appointment type
    function selectApptType(el, name, duration) {
      document.querySelectorAll('.appt-type-card').forEach(function(c) { c.classList.remove('selected'); });
      el.classList.add('selected');
      bookingState.apptType = name;
      bookingState.apptDuration = duration;
      document.getElementById('btnToStep2').disabled = false;
    }

    // Step navigation
    function goToStep(step) {
      bookingState.step = step;
      // Update panels
      document.querySelectorAll('.booking-panel').forEach(function(p) { p.classList.remove('active'); });
      var panels = ['panelType', 'panelDateTime', 'panelInfo', 'panelConfirm'];
      document.getElementById(panels[step - 1]).classList.add('active');
      // Update step indicators
      for (var i = 1; i <= 4; i++) {
        var s = document.getElementById('bkStep' + i);
        s.classList.remove('active', 'done');
        if (i < step) s.classList.add('done');
        else if (i === step) s.classList.add('active');
      }
      for (var j = 1; j <= 3; j++) {
        var line = document.getElementById('bkLine' + j);
        line.classList.toggle('done', j < step);
      }
      // Init calendar when entering step 2 (wait for office hours)
      if (step === 2) officeHoursReady.then(function() { renderCalendar(); });
      // Build summary when entering step 3
      if (step === 3) buildSummary();
    }

    // Calendar rendering
    var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function renderCalendar() {
      var year = bookingState.currentYear;
      var month = bookingState.currentMonth;
      var today = new Date(); today.setHours(0,0,0,0);

      document.getElementById('calMonthYear').textContent = MONTH_NAMES[month] + ' ' + year;

      // Disable prev if current month
      var now = new Date();
      document.getElementById('calPrev').disabled = (year === now.getFullYear() && month === now.getMonth());

      // Remove old day cells
      var grid = document.getElementById('calGrid');
      grid.querySelectorAll('.cal-day').forEach(function(d) { d.remove(); });

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      // Empty cells before first day
      for (var e = 0; e < firstDay; e++) {
        var empty = document.createElement('div');
        empty.className = 'cal-day empty';
        grid.appendChild(empty);
      }

      // Day cells
      for (var d = 1; d <= daysInMonth; d++) {
        var cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        var cellDate = new Date(year, month, d);
        var dayOfWeek = cellDate.getDay();

        // Disable past days and days with no office hours
        if (cellDate < today || !OFFICE_HOURS[dayOfWeek]) {
          cell.classList.add('disabled');
        } else {
          cell.dataset.date = year + '-' + (month + 1 < 10 ? '0' + (month + 1) : month + 1) + '-' + (d < 10 ? '0' + d : d);
          cell.onclick = function() { selectDate(this); };
        }

        // Highlight today
        if (cellDate.getTime() === today.getTime()) cell.classList.add('today');

        // Re-highlight selected date
        if (bookingState.selectedDate && cell.dataset.date === bookingState.selectedDate) {
          cell.classList.add('selected');
        }

        grid.appendChild(cell);
      }
    }

    function changeMonth(dir) {
      bookingState.currentMonth += dir;
      if (bookingState.currentMonth > 11) { bookingState.currentMonth = 0; bookingState.currentYear++; }
      if (bookingState.currentMonth < 0) { bookingState.currentMonth = 11; bookingState.currentYear--; }
      renderCalendar();
    }

    function selectDate(el) {
      document.querySelectorAll('.cal-day.selected').forEach(function(d) { d.classList.remove('selected'); });
      el.classList.add('selected');
      bookingState.selectedDate = el.dataset.date;
      bookingState.selectedTime = null;
      document.getElementById('btnToStep3').disabled = true;
      showTimeSlots();
    }

    function showTimeSlots() {
      var section = document.getElementById('timeSlotsSection');
      var container = document.getElementById('timeSlotsContainer');
      var label = document.getElementById('timeSlotsLabel');
      section.style.display = 'block';

      var dateParts = bookingState.selectedDate.split('-');
      var selDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      var dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][selDate.getDay()];
      var monthName = MONTH_NAMES[selDate.getMonth()];
      label.textContent = 'Available times for ' + dayName + ', ' + monthName + ' ' + selDate.getDate();

      // Show loading
      container.innerHTML = '<div class="time-slots-loading"><div class="booking-spinner" style="margin: 0 auto;"></div></div>';

      // Fetch busy times (or use empty if no Apps Script)
      fetchBusyTimes(bookingState.selectedDate, function(busyTimes) {
        var allSlots = getTimeSlotsForDate(selDate);

        // Filter out busy times (accounting for appointment duration)
        var duration = bookingState.apptDuration || 30;
        var availableSlots = allSlots.filter(function(slot) {
          var parts = slot.time24.split(':');
          var endMins = parseInt(parts[0]) * 60 + parseInt(parts[1]) + duration;
          var endH = Math.floor(endMins / 60);
          var endM = endMins % 60;
          var slotEnd = (endH < 10 ? '0' : '') + endH + ':' + (endM < 10 ? '0' : '') + endM;
          return !busyTimes.some(function(busy) {
            return slot.time24 < busy.end && slotEnd > busy.start;
          });
        });

        // Filter out past times if today
        var now = new Date();
        if (selDate.toDateString() === now.toDateString()) {
          var currentTime = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
          availableSlots = availableSlots.filter(function(slot) { return slot.time24 > currentTime; });
        }

        if (availableSlots.length === 0) {
          container.innerHTML = '<div class="time-slots-empty">No available times on this date. Please select another day.</div>';
          return;
        }

        var html = '<div class="time-slots-grid">';
        availableSlots.forEach(function(slot) {
          html += '<div class="time-slot" onclick="selectTime(this, \'' + slot.time24 + '\', \'' + slot.label + '\')">' + slot.label + '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
      });
    }

    function selectTime(el, time24, label) {
      document.querySelectorAll('.time-slot.selected').forEach(function(s) { s.classList.remove('selected'); });
      el.classList.add('selected');
      bookingState.selectedTime = { time24: time24, label: label };
      document.getElementById('btnToStep3').disabled = false;
    }

    // Build appointment summary
    function buildSummary() {
      var dateParts = bookingState.selectedDate.split('-');
      var selDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      var dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][selDate.getDay()];
      var monthName = MONTH_NAMES[selDate.getMonth()];
      var dateStr = dayName + ', ' + monthName + ' ' + selDate.getDate() + ', ' + selDate.getFullYear();
      var html = '<div class="booking-summary-row"><span class="label">Service</span><span class="value">' + bookingState.apptType + '</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Duration</span><span class="value">' + bookingState.apptDuration + ' minutes</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Date</span><span class="value">' + dateStr + '</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Time</span><span class="value">' + bookingState.selectedTime.label + ' ET</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Provider</span><span class="value">Dr. Nageley Michel, DNP, PMHNP, FNP</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Format</span><span class="value">Secure Telehealth (Video)</span></div>';
      document.getElementById('bookingSummary').innerHTML = html;
    }

    // Toggle conditional reason fields
    function toggleReasonOther(value) {
      var otherGroup = document.getElementById('reasonOtherGroup');
      if (otherGroup) otherGroup.style.display = value === 'Other' ? 'block' : 'none';
    }

    // ─── RxNorm MEDICATION SEARCH ───
    var selectedMeds = [];
    var medSearchTimer = null;
    var activeSuggestion = -1;

    (function initMedSearch() {
      var input = document.getElementById('medSearchInput');
      if (!input) return;

      input.addEventListener('input', function() {
        clearTimeout(medSearchTimer);
        var query = input.value.trim();
        if (query.length < 2) { hideMedSuggestions(); return; }
        showMedLoading();
        medSearchTimer = setTimeout(function() { searchRxNorm(query); }, 300);
      });

      input.addEventListener('keydown', function(e) {
        var items = document.querySelectorAll('#medSuggestions .med-suggestion-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeSuggestion = Math.min(activeSuggestion + 1, items.length - 1);
          updateActiveSuggestion(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeSuggestion = Math.max(activeSuggestion - 1, 0);
          updateActiveSuggestion(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeSuggestion >= 0 && items[activeSuggestion]) {
            addMedication(items[activeSuggestion].textContent);
          }
        }
      });

      // Close suggestions on outside click
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#medicationGroup')) hideMedSuggestions();
      });
    })();

    function searchRxNorm(query) {
      fetch('https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=' + encodeURIComponent(query) + '&maxEntries=10')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var candidates = (data.approximateGroup && data.approximateGroup.candidate) || [];
          var names = [];
          var seen = {};
          candidates.forEach(function(c) {
            var name = (c.name || '').split(' [')[0].split(' {')[0].trim();
            var nameUpper = name.toUpperCase();
            if (name && !seen[nameUpper] && selectedMeds.indexOf(name) === -1) {
              seen[nameUpper] = true;
              names.push(name);
            }
          });
          renderMedSuggestions(names);
        })
        .catch(function() {
          renderMedSuggestions([]);
        });
    }

    function renderMedSuggestions(names) {
      var container = document.getElementById('medSuggestions');
      activeSuggestion = -1;
      if (names.length === 0) {
        container.innerHTML = '<div class="med-no-results">No medications found</div>';
        container.style.display = 'block';
        return;
      }
      var html = '';
      names.forEach(function(name) {
        html += '<div class="med-suggestion-item" onclick="addMedication(\'' + esc(name).replace(/'/g, "\\'") + '\')">' + esc(name) + '</div>';
      });
      container.innerHTML = html;
      container.style.display = 'block';
    }

    function showMedLoading() {
      var container = document.getElementById('medSuggestions');
      container.innerHTML = '<div class="med-loading">Searching medications...</div>';
      container.style.display = 'block';
    }

    function hideMedSuggestions() {
      var container = document.getElementById('medSuggestions');
      if (container) { container.style.display = 'none'; activeSuggestion = -1; }
    }

    function updateActiveSuggestion(items) {
      items.forEach(function(item, i) {
        item.classList.toggle('active', i === activeSuggestion);
      });
      if (items[activeSuggestion]) items[activeSuggestion].scrollIntoView({ block: 'nearest' });
    }

    function addMedication(name) {
      if (selectedMeds.indexOf(name) !== -1) return;
      selectedMeds.push(name);
      updateMedDisplay();
      document.getElementById('medSearchInput').value = '';
      hideMedSuggestions();
    }

    function removeMedication(name) {
      selectedMeds = selectedMeds.filter(function(m) { return m !== name; });
      updateMedDisplay();
    }

    function updateMedDisplay() {
      var list = document.getElementById('medSelectedList');
      var hidden = document.getElementById('medHiddenInput');
      var html = '';
      selectedMeds.forEach(function(name) {
        html += '<span class="med-chip">' + esc(name) +
          '<button type="button" class="med-chip-remove" onclick="removeMedication(\'' + esc(name).replace(/'/g, "\\'") + '\')" aria-label="Remove ' + esc(name) + '">&times;</button>' +
          '</span>';
      });
      list.innerHTML = html;
      hidden.value = selectedMeds.join(', ');
    }

    // ─── STATE OF RESIDENCE ───
    var LICENSED_STATES = [
      'AK','AZ','CO','CT','DC','FL','IA','ID','KS','MA','MD',
      'MN','MT','ND','NH','NM','NV','NY','OR','SD','UT','VA',
      'VT','WA','WV','WY'
    ];
    var PENDING_STATES = ['CA','DE','HI','IL','ME','NE','NJ','OK','RI','TX','WI'];
    var ALL_US_STATES = [
      {a:'AL',n:'Alabama'},{a:'AK',n:'Alaska'},{a:'AZ',n:'Arizona'},{a:'AR',n:'Arkansas'},
      {a:'CA',n:'California'},{a:'CO',n:'Colorado'},{a:'CT',n:'Connecticut'},{a:'DE',n:'Delaware'},
      {a:'DC',n:'Washington DC'},{a:'FL',n:'Florida'},{a:'GA',n:'Georgia'},{a:'HI',n:'Hawaii'},
      {a:'ID',n:'Idaho'},{a:'IL',n:'Illinois'},{a:'IN',n:'Indiana'},{a:'IA',n:'Iowa'},
      {a:'KS',n:'Kansas'},{a:'KY',n:'Kentucky'},{a:'LA',n:'Louisiana'},{a:'ME',n:'Maine'},
      {a:'MD',n:'Maryland'},{a:'MA',n:'Massachusetts'},{a:'MI',n:'Michigan'},{a:'MN',n:'Minnesota'},
      {a:'MS',n:'Mississippi'},{a:'MO',n:'Missouri'},{a:'MT',n:'Montana'},{a:'NE',n:'Nebraska'},
      {a:'NV',n:'Nevada'},{a:'NH',n:'New Hampshire'},{a:'NJ',n:'New Jersey'},{a:'NM',n:'New Mexico'},
      {a:'NY',n:'New York'},{a:'NC',n:'North Carolina'},{a:'ND',n:'North Dakota'},{a:'OH',n:'Ohio'},
      {a:'OK',n:'Oklahoma'},{a:'OR',n:'Oregon'},{a:'PA',n:'Pennsylvania'},{a:'RI',n:'Rhode Island'},
      {a:'SC',n:'South Carolina'},{a:'SD',n:'South Dakota'},{a:'TN',n:'Tennessee'},{a:'TX',n:'Texas'},
      {a:'UT',n:'Utah'},{a:'VT',n:'Vermont'},{a:'VA',n:'Virginia'},{a:'WA',n:'Washington'},
      {a:'WV',n:'West Virginia'},{a:'WI',n:'Wisconsin'},{a:'WY',n:'Wyoming'}
    ];

    // Populate state dropdown on load (skip if already populated in HTML)
    (function populateStateDropdown() {
      var sel = document.getElementById('bookingState');
      if (!sel || sel.options.length > 1) return;
      ALL_US_STATES.forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.a;
        opt.textContent = s.n;
        sel.appendChild(opt);
      });
    })();

    function onStateChange(val) {
      var msg = document.getElementById('stateEligibilityMsg');
      var btn = document.getElementById('btnSubmit');
      if (!val) { msg.style.display = 'none'; return; }
      if (LICENSED_STATES.indexOf(val) !== -1) {
        msg.style.display = 'block';
        msg.className = 'state-eligibility-msg state-eligible';
        msg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> We are licensed to provide telehealth services in your state.';
        if (btn) btn.disabled = false;
      } else if (PENDING_STATES.indexOf(val) !== -1) {
        msg.style.display = 'block';
        msg.className = 'state-eligibility-msg state-pending';
        msg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Licensure pending in your state. You can still book &mdash; we&rsquo;ll confirm once approved.';
        if (btn) btn.disabled = false;
      } else {
        msg.style.display = 'block';
        msg.className = 'state-eligibility-msg state-ineligible';
        msg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg> We are not yet licensed in your state. <a href="#contact" onclick="document.getElementById(\'contactModal\').style.display=\'flex\'">Join our waitlist</a> to be notified when we expand.';
        if (btn) btn.disabled = true;
      }
    }

    // Input validation patterns
    var VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var VALID_PHONE = /^[\d\s\-\(\)\+\.]{7,20}$/;
    var VALID_NAME = /^[a-zA-Z\s\-'.]{1,100}$/;
    var VALID_DOB = /^\d{4}-\d{2}-\d{2}$/;

    // Submit booking
    function submitBooking(event) {
      event.preventDefault();
      if (rateLimited('booking', 10000)) { alert('Please wait a moment before submitting again.'); return false; }
      var form = document.getElementById('patientForm');
      var data = new FormData(form);
      var btn = document.getElementById('btnSubmit');

      // Validate inputs before sending
      var firstName = (data.get('firstName') || '').trim();
      var lastName = (data.get('lastName') || '').trim();
      var email = (data.get('email') || '').trim();
      var phone = (data.get('phone') || '').trim();
      var dob = (data.get('dob') || '').trim();
      var state = (data.get('state') || '').trim();

      if (!firstName || !VALID_NAME.test(firstName)) { alert('Please enter a valid first name.'); return false; }
      if (!lastName || !VALID_NAME.test(lastName)) { alert('Please enter a valid last name.'); return false; }
      if (!email || !VALID_EMAIL.test(email)) { alert('Please enter a valid email address.'); return false; }
      if (!phone || !VALID_PHONE.test(phone)) { alert('Please enter a valid phone number.'); return false; }
      if (!dob || !VALID_DOB.test(dob)) { alert('Please enter a valid date of birth.'); return false; }
      if (!state) { alert('Please select your state of residence.'); return false; }
      if (LICENSED_STATES.indexOf(state) === -1 && PENDING_STATES.indexOf(state) === -1) { alert('We are not yet licensed to provide telehealth services in your state.'); return false; }

      btn.disabled = true;
      btn.innerHTML = '<div class="booking-spinner" style="width:20px;height:20px;border-width:2px;"></div> Booking...';

      var dateParts = bookingState.selectedDate.split('-');
      var selDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      var dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][selDate.getDay()];
      var monthName = MONTH_NAMES[selDate.getMonth()];
      var dateStr = dayName + ', ' + monthName + ' ' + selDate.getDate() + ', ' + selDate.getFullYear();

      var bookingData = {
        apptType: bookingState.apptType,
        duration: bookingState.apptDuration,
        date: bookingState.selectedDate,
        time: bookingState.selectedTime.time24,
        timeLabel: bookingState.selectedTime.label,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        dob: dob,
        state: state,
        insurance: data.get('insurance'),
        reason: data.get('reason') === 'Other' ? (data.get('reasonOther') || '').substring(0, 500) : (data.get('reason') || ''),
        medications: selectedMeds.length > 0 ? selectedMeds.join(', ') : ''
      };

      // If Apps Script is configured, send to backend
      if (APPS_SCRIPT_URL) {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(bookingData),
          redirect: 'follow'
        }).then(function(r) { return r.json(); })
        .then(function(result) {
          bookingData.confirmationCode = result.confirmationCode || null;
          showConfirmation(bookingData, dateStr);
        }).catch(function() {
          showConfirmation(bookingData, dateStr);
        });
      } else {
        sendEmailFallback();
      }
      return false;
    }

    function sendEmailFallback() {
      // HIPAA: Do NOT send PHI via mailto — show call-to-action instead
      var confirmEl = document.getElementById('confirmDetails');
      if (confirmEl) {
        confirmEl.textContent = 'Our online booking system is temporarily unavailable. Please call (866) 796-9995 to schedule your appointment.';
      }
      var summaryEl = document.getElementById('confirmSummary');
      if (summaryEl) {
        summaryEl.innerHTML = '<div class="booking-summary-row"><span class="label">Phone</span><span class="value"><a href="tel:8667969995">(866) 796-9995</a></span></div>' +
          '<div class="booking-summary-row"><span class="label">Hours</span><span class="value">Mon-Sat 9AM-10PM ET</span></div>';
      }
      goToStep(4);
    }

    function showConfirmation(bd, dateStr) {
      document.getElementById('confirmDetails').textContent =
        'Your ' + bd.apptType + ' request with Dr. Nageley Michel, DNP, PMHNP, FNP for ' + dateStr + ' at ' + bd.timeLabel + ' ET has been received. We will review your information and reach out to confirm your appointment.';
      var html = '';
      if (bd.confirmationCode) {
        html += '<div style="background:#2C4A5A;border-radius:10px;padding:16px 20px;margin-bottom:16px;text-align:center;">' +
          '<div style="color:#b0c4ce;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Confirmation Code</div>' +
          '<div style="color:#D4A855;font-size:22px;font-weight:700;letter-spacing:2px;">' + esc(bd.confirmationCode) + '</div>' +
        '</div>';
      }
      html += '<div class="booking-summary-row"><span class="label">Service</span><span class="value">' + esc(bd.apptType) + '</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Date &amp; Time</span><span class="value">' + esc(dateStr) + ' at ' + esc(bd.timeLabel) + ' ET</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Patient</span><span class="value">' + esc(bd.firstName) + ' ' + esc(bd.lastName) + '</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Email</span><span class="value">' + esc(bd.email) + '</span></div>';
      html += '<div class="booking-summary-row"><span class="label">Format</span><span class="value">Secure Telehealth (Video Call)</span></div>';
      document.getElementById('confirmSummary').innerHTML = html;
      goToStep(4);
    }

    function resetBooking() {
      bookingState = { step: 1, apptType: null, apptDuration: null, selectedDate: null, selectedTime: null, currentMonth: new Date().getMonth(), currentYear: new Date().getFullYear() };
      document.querySelectorAll('.appt-type-card').forEach(function(c) { c.classList.remove('selected'); });
      document.getElementById('btnToStep2').disabled = true;
      document.getElementById('btnToStep3').disabled = true;
      var btn = document.getElementById('btnSubmit');
      btn.disabled = false;
      btn.innerHTML = 'Submit Request <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      document.getElementById('patientForm').reset();
      document.getElementById('timeSlotsSection').style.display = 'none';
      // Reset conditional fields
      selectedMeds = [];
      updateMedDisplay();
      var otherGroup = document.getElementById('reasonOtherGroup');
      if (otherGroup) otherGroup.style.display = 'none';
      goToStep(1);
    }

    // ─── FORM MODALS ───
    function openModal(id) {
      document.getElementById(id).classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
      document.body.style.overflow = '';
      // Reset form after closing
      setTimeout(function() {
        var formView = document.getElementById(id === 'facilityModal' ? 'facilityFormView' : 'erFormView');
        var successView = document.getElementById(id === 'facilityModal' ? 'facilitySuccess' : 'erSuccess');
        if (formView) formView.style.display = '';
        if (successView) successView.style.display = 'none';
        var form = formView ? formView.querySelector('form') : null;
        if (form) form.reset();
      }, 300);
    }

    function submitForm(event, type) {
      event.preventDefault();
      if (rateLimited('form_' + type, 10000)) { alert('Please wait a moment before submitting again.'); return false; }
      var form = event.target;
      var data = new FormData(form);
      var subject = type === 'facility'
        ? 'Facility Partnership Inquiry - ' + data.get('facility')
        : 'ER Tele-Psych Partnership Inquiry - ' + data.get('facility');
      var body = '';
      data.forEach(function(value, key) {
        if (value) body += key.charAt(0).toUpperCase() + key.slice(1) + ': ' + value + '\n';
      });
      // Send via mailto as a reliable fallback (no backend needed)
      var mailto = 'mailto:contact@ennhealth.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
      // Show success state
      var formView = document.getElementById(type === 'facility' ? 'facilityFormView' : 'erFormView');
      var successView = document.getElementById(type === 'facility' ? 'facilitySuccess' : 'erSuccess');
      formView.style.display = 'none';
      successView.style.display = '';
      return false;
    }

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(function(modal) {
          closeModal(modal.id);
        });
      }
    });

    // ─── MOBILE MENU ───
    function toggleMobileMenu() {
      var nav = document.querySelector('.nav');
      var overlay = document.getElementById('mobileOverlay');
      var menuIcon = document.querySelector('.menu-icon');
      var closeIcon = document.querySelector('.close-icon');
      var menuBtn = document.getElementById('menuBtn');
      var header = document.querySelector('.header');
      var isOpen = nav.classList.contains('open');
      if (isOpen) {
        nav.classList.remove('open');
        overlay.classList.remove('active');
        menuIcon.style.display = '';
        closeIcon.style.display = 'none';
        document.body.style.overflow = '';
        document.body.classList.remove('menu-open');
        if (header) header.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open navigation menu');
      } else {
        nav.classList.add('open');
        overlay.classList.add('active');
        menuIcon.style.display = 'none';
        closeIcon.style.display = '';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('menu-open');
        if (header) header.classList.add('menu-open');
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.setAttribute('aria-label', 'Close navigation menu');
      }
    }
    // Close mobile menu when nav links are clicked
    document.querySelectorAll('.nav a').forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          toggleMobileMenu();
        }
      });
    });
    // Close login dropdown on click outside
    document.addEventListener('click', function(e) {
      var wrap = document.querySelector('.nav-login-wrap');
      if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
    });
    // Close menu on window resize to desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        var nav = document.querySelector('.nav');
        var overlay = document.getElementById('mobileOverlay');
        nav.classList.remove('open');
        nav.style.display = '';
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.querySelector('.menu-icon').style.display = '';
        document.querySelector('.close-icon').style.display = 'none';
      }
    });

    // ─── HERO: Load real next available appointments ───
    // Waits for office hours to load first so closed days + custom start times are respected
    officeHoursReady.then(function loadHeroAvailability() {
      if (!APPS_SCRIPT_URL) return;

    });

      // ─── HERO INLINE QUIZ ───
      var hqData = {
        adhd: {
          name: 'ADHD', tool: 'ASRS-v1.1', fullUrl: '/quiz/adhd/', ctaText: 'Schedule Your ADHD Management',
          questions: [
            'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?',
            'How often do you have difficulty getting things in order when you have to do a task that requires organization?',
            'How often do you have problems remembering appointments or obligations?',
            'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?',
            'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?',
            'How often do you feel overly active and compelled to do things, like you were driven by a motor?'
          ],
          options: ['Never','Rarely','Sometimes','Often','Very Often'],
          values: [0,1,2,3,4],
          maxScore: 24,
          scoring: [
            {min:0,max:6,level:'Low Likelihood',color:'#22c55e',desc:'Your responses suggest a low likelihood of ADHD symptoms. If you still have concerns, consider discussing them with a provider.'},
            {min:7,max:13,level:'Moderate Likelihood',color:'#f59e0b',desc:'Your responses suggest some ADHD-related symptoms that may benefit from professional evaluation.'},
            {min:14,max:24,level:'Higher Likelihood',color:'#ef4444',desc:'Your responses suggest a higher likelihood of ADHD symptoms. We recommend scheduling a professional screening.'}
          ]
        },
        anxiety: {
          name: 'Anxiety', tool: 'GAD-7', fullUrl: '/quiz/anxiety/',
          context: 'Over the last 2 weeks, how often have you been bothered by the following?',
          questions: [
            'Feeling nervous, anxious, or on edge',
            'Not being able to stop or control worrying',
            'Worrying too much about different things',
            'Trouble relaxing',
            'Being so restless that it is hard to sit still',
            'Becoming easily annoyed or irritable',
            'Feeling afraid, as if something awful might happen'
          ],
          options: ['Not at all','Several days','More than half the days','Nearly every day'],
          values: [0,1,2,3],
          maxScore: 21,
          scoring: [
            {min:0,max:4,level:'Minimal Anxiety',color:'#22c55e',desc:'Your responses suggest minimal anxiety symptoms. If you still have concerns, consider speaking with a provider.'},
            {min:5,max:9,level:'Mild Anxiety',color:'#84cc16',desc:'Your responses suggest mild anxiety. Monitoring symptoms and lifestyle changes may help.'},
            {min:10,max:14,level:'Moderate Anxiety',color:'#f59e0b',desc:'Your responses suggest moderate anxiety that may benefit from professional evaluation and treatment.'},
            {min:15,max:21,level:'Severe Anxiety',color:'#ef4444',desc:'Your responses suggest severe anxiety. We strongly recommend scheduling a professional evaluation.'}
          ]
        },
        depression: {
          name: 'Depression', tool: 'PHQ-9', fullUrl: '/quiz/depression/',
          context: 'Over the last 2 weeks, how often have you been bothered by the following?',
          questions: [
            'Little interest or pleasure in doing things',
            'Feeling down, depressed, or hopeless',
            'Trouble falling or staying asleep, or sleeping too much',
            'Feeling tired or having little energy',
            'Poor appetite or overeating',
            'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
            'Trouble concentrating on things, such as reading or watching TV',
            'Moving or speaking so slowly that others could have noticed — or the opposite, being fidgety or restless',
            'Thoughts that you would be better off dead, or of hurting yourself'
          ],
          options: ['Not at all','Several days','More than half the days','Nearly every day'],
          values: [0,1,2,3],
          maxScore: 27,
          scoring: [
            {min:0,max:4,level:'Minimal',color:'#22c55e',desc:'Your responses suggest minimal depression symptoms.'},
            {min:5,max:9,level:'Mild Depression',color:'#84cc16',desc:'Your responses suggest mild depressive symptoms that may benefit from monitoring.'},
            {min:10,max:14,level:'Moderate Depression',color:'#f59e0b',desc:'Your responses suggest moderate depression. Professional evaluation is recommended.'},
            {min:15,max:19,level:'Moderately Severe',color:'#f97316',desc:'Your responses suggest moderately severe depression. We recommend scheduling an evaluation.'},
            {min:20,max:27,level:'Severe Depression',color:'#ef4444',desc:'Your responses suggest severe depression. Please schedule a professional evaluation as soon as possible.'}
          ]
        },
        ptsd: {
          name: 'PTSD', tool: 'PC-PTSD-5', fullUrl: '/quiz/ptsd/',
          context: 'In your life, have you ever had any experience that was so frightening, horrible, or upsetting that, in the past month, you have...',
          questions: [
            'Had nightmares about the event(s) or thought about the event(s) when you did not want to?',
            'Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?',
            'Been constantly on guard, watchful, or easily startled?',
            'Felt numb or detached from people, activities, or your surroundings?',
            'Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?'
          ],
          options: ['No','Yes'],
          values: [0,1],
          maxScore: 5,
          scoring: [
            {min:0,max:1,level:'Low Likelihood',color:'#22c55e',desc:'Your responses suggest a low likelihood of PTSD symptoms.'},
            {min:2,max:3,level:'Moderate Likelihood',color:'#f59e0b',desc:'Your responses suggest some trauma-related symptoms that may benefit from professional evaluation.'},
            {min:4,max:5,level:'Higher Likelihood',color:'#ef4444',desc:'Your responses suggest a higher likelihood of PTSD symptoms. We strongly recommend a professional evaluation.'}
          ]
        },
        alcohol: {
          name: 'Alcohol Use', tool: 'AUDIT-C', fullUrl: '/quiz/alcohol/',
          questions: [
            'How often do you have a drink containing alcohol?',
            'How many drinks containing alcohol do you have on a typical day when you are drinking?',
            'How often do you have 6 or more drinks on one occasion?'
          ],
          options: ['Never','Monthly or less','2-4 times a month','2-3 times a week','4+ times a week'],
          values: [0,1,2,3,4],
          maxScore: 12,
          scoring: [
            {min:0,max:2,level:'Low Risk',color:'#22c55e',desc:'Your responses suggest low-risk alcohol use. Continue to monitor your habits.'},
            {min:3,max:5,level:'Moderate Risk',color:'#f59e0b',desc:'Your responses suggest moderate-risk drinking patterns that may benefit from a conversation with a provider.'},
            {min:6,max:12,level:'Higher Risk',color:'#ef4444',desc:'Your responses suggest higher-risk drinking patterns. We recommend speaking with a provider about your alcohol use.'}
          ]
        }
      };

      var hqState = { quiz: null, q: 0, answers: {} };

      window.startHeroQuiz = function(key) {
        hqState = { quiz: key, q: 0, answers: {} };
        document.getElementById('hqMenu').style.display = 'none';
        var el = document.getElementById('hqActive');
        el.style.display = 'block';
        renderHQ();
      };

      window.hqBack = function() {
        document.getElementById('hqActive').style.display = 'none';
        document.getElementById('hqMenu').style.display = 'block';
        hqState = { quiz: null, q: 0, answers: {} };
      };

      window.hqSelect = function(idx) {
        hqState.answers[hqState.q] = idx;
        renderHQ();
      };

      window.hqNext = function() {
        var d = hqData[hqState.quiz];
        if (hqState.answers[hqState.q] === undefined) return;
        if (hqState.q === d.questions.length - 1) { showHQResults(); return; }
        hqState.q++;
        renderHQ();
      };

      window.hqPrev = function() {
        if (hqState.q > 0) { hqState.q--; renderHQ(); }
      };

      function renderHQ() {
        var d = hqData[hqState.quiz];
        var q = hqState.q;
        var total = d.questions.length;
        var pct = Math.round((q / total) * 100);
        var isLast = q === total - 1;

        var h = '<div class="hq-header"><h3>' + d.name + ' Screening</h3><button class="hq-back" onclick="hqBack()">&#8592; Back</button></div>';
        h += '<div class="hq-progress"><div class="hq-progress-fill" style="width:' + pct + '%"></div></div>';
        h += '<div class="hq-qnum">Question ' + (q+1) + ' of ' + total + '</div>';
        if (q === 0 && d.context) h += '<div class="hq-context">' + d.context + '</div>';
        h += '<div class="hq-qtext">' + d.questions[q] + '</div>';
        h += '<div class="hq-opts">';
        for (var i = 0; i < d.options.length; i++) {
          var sel = hqState.answers[q] === i ? ' selected' : '';
          h += '<button class="hq-opt' + sel + '" onclick="hqSelect(' + i + ')"><div class="hq-opt-dot"></div><span>' + d.options[i] + '</span></button>';
        }
        h += '</div>';
        h += '<div class="hq-nav">';
        h += '<button class="hq-nav-btn prev" onclick="hqPrev()"' + (q === 0 ? ' disabled' : '') + '>&larr; Prev</button>';
        h += '<button class="hq-nav-btn next" onclick="hqNext()"' + (hqState.answers[q] === undefined ? ' disabled' : '') + '>' + (isLast ? 'See Results' : 'Next &rarr;') + '</button>';
        h += '</div>';
        document.getElementById('hqActive').innerHTML = h;
      }

      function showHQResults() {
        var d = hqData[hqState.quiz];
        var score = 0;
        for (var i = 0; i < d.questions.length; i++) score += d.values[hqState.answers[i]];
        var result = d.scoring[0];
        for (var s = 0; s < d.scoring.length; s++) {
          if (score >= d.scoring[s].min && score <= d.scoring[s].max) { result = d.scoring[s]; break; }
        }
        var pct = Math.round((score / d.maxScore) * 100);
        var h = '<div class="hq-header"><h3>' + d.name + ' Results</h3><button class="hq-back" onclick="hqBack()">&#8592; Back</button></div>';
        h += '<div class="hq-result">';
        h += '<div class="hq-result-score">' + score + '</div>';
        h += '<div class="hq-result-max">of ' + d.maxScore + ' (' + d.tool + ')</div>';
        h += '<div class="hq-result-bar"><div class="hq-result-bar-fill" style="width:' + pct + '%;background:' + result.color + '"></div></div>';
        h += '<div class="hq-result-level" style="background:rgba(255,255,255,0.06);color:' + result.color + ';border:1px solid ' + result.color + '">' + result.level + '</div>';
        h += '<p class="hq-result-desc">' + result.desc + '</p>';
        h += '<a href="/#book" class="hq-result-cta">' + (d.ctaText || 'Schedule Your Evaluation') + ' &rarr;</a>';
        h += '<a href="' + d.fullUrl + '" class="hq-result-full">Take full ' + d.name + ' assessment &rarr;</a>';
        h += '</div>';
        document.getElementById('hqActive').innerHTML = h;

        if (typeof gtag === 'function') {
          gtag('event', 'quiz_complete', { quiz_name: d.name + ' ' + d.tool, quiz_score: score, quiz_result: result.level });
        }
      }

    // ─── FAQ TOGGLE (accessible) ───
    function toggleFaq(btn) {
      var item = btn.parentElement;
      var isOpen = item.classList.contains('open');
      item.classList.toggle('open');
      btn.setAttribute('aria-expanded', !isOpen);
    }

    // ─── INSURANCE ELIGIBILITY VERIFICATION ───
    window.eligibilityResult = null;

    // Toggle standalone eligibility form in pricing section
    function toggleEligibilityForm() {
      var form = document.getElementById('eligibilityForm');
      var btn = document.getElementById('verifyInsBtn');
      if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.textContent = 'Hide Verification';
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        form.style.display = 'none';
        btn.textContent = 'Check My Coverage';
      }
    }

    // Standalone eligibility check (pricing section)
    function checkEligibility() {
      if (rateLimited('eligibility', 5000)) { alert('Please wait a few seconds before checking again.'); return; }
      var insurance = document.getElementById('eligInsurance').value;
      var memberId = document.getElementById('eligMemberId').value.trim();
      var dob = document.getElementById('eligDob').value;
      var firstName = document.getElementById('eligFirstName').value.trim();
      var lastName = document.getElementById('eligLastName').value.trim();

      if (!insurance) { alert('Please select your insurance provider.'); return; }
      if (!memberId) { alert('Please enter your Member ID.'); return; }
      if (!dob) { alert('Please enter your date of birth.'); return; }

      var btn = document.getElementById('eligSubmitBtn');
      var resultsDiv = document.getElementById('eligibilityResults');
      btn.disabled = true;
      btn.textContent = 'Checking coverage...';
      resultsDiv.style.display = 'none';

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'checkEligibility',
          insurance: insurance,
          memberId: memberId,
          dob: dob,
          firstName: firstName || undefined,
          lastName: lastName || undefined
        }),
        redirect: 'follow'
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        btn.disabled = false;
        btn.textContent = 'Verify My Coverage';
        if (data.success) {
          var _eligCache = data.eligibility;
          _eligCache._insurance = insurance;
          renderEligibilityResults(resultsDiv, _eligCache);
        } else {
          renderEligibilityError(resultsDiv, data.error);
        }
        resultsDiv.style.display = 'block';
      })
      .catch(function() {
        btn.disabled = false;
        btn.textContent = 'Verify My Coverage';
        renderEligibilityError(resultsDiv, 'Network error. Please try again or call (407) 796-2406.');
        resultsDiv.style.display = 'block';
      });
    }

    function renderEligibilityResults(container, elig) {
      if (elig.status === 'inactive') {
        renderEligibilityInactive(container, elig);
        return;
      }
      var mh = elig.mentalHealth;
      var html = '<div class="elig-result elig-active">' +
        '<div class="elig-result-header">' +
          '<div class="elig-status-icon active">&#10003;</div>' +
          '<div>' +
            '<div class="elig-status-text">Coverage Active</div>' +
            '<div class="elig-plan-name">' + esc(elig.carrier) + (elig.planName ? ' &mdash; ' + esc(elig.planName) : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="elig-network ' + (elig.network === 'in_network' ? 'in' : 'out') + '">' +
          (elig.network === 'in_network' ? '&#10003; In-Network Provider' : '&#9888; Out-of-Network') +
        '</div>' +
        '<div class="elig-benefits">' +
          '<div class="elig-benefit"><div class="elig-benefit-label">Mental Health Copay</div><div class="elig-benefit-value">' + (mh.copay !== null ? '$' + mh.copay : 'Contact plan') + '</div></div>' +
          '<div class="elig-benefit"><div class="elig-benefit-label">Coinsurance</div><div class="elig-benefit-value">' + (mh.coinsurance !== null ? mh.coinsurance + '%' : 'N/A') + '</div></div>' +
          '<div class="elig-benefit"><div class="elig-benefit-label">Deductible</div><div class="elig-benefit-value">' + (mh.deductible !== null ? '$' + mh.deductible.toLocaleString() : 'N/A') + '</div></div>' +
          '<div class="elig-benefit"><div class="elig-benefit-label">Out-of-Pocket Max</div><div class="elig-benefit-value">' + (mh.outOfPocketMax !== null ? '$' + mh.outOfPocketMax.toLocaleString() : 'N/A') + '</div></div>' +
        '</div>' +
        '<p class="elig-disclaimer">Benefits shown are estimates based on your plan. Actual costs may vary. Final verification occurs at time of service.</p>' +
        '<a href="#book" class="payment-btn gold" style="display:inline-block;margin-top:12px;text-align:center;" onclick="prefillBookingInsurance()">Book Your Appointment &rarr;</a>' +
      '</div>';
      container.innerHTML = html;
    }

    function renderEligibilityInactive(container, elig) {
      container.innerHTML = '<div class="elig-result elig-inactive">' +
        '<div class="elig-result-header">' +
          '<div class="elig-status-icon inactive">&#9888;</div>' +
          '<div>' +
            '<div class="elig-status-text" style="color:#b45309;">Coverage Not Confirmed</div>' +
            '<div class="elig-plan-name">' + esc(elig.carrier) + '</div>' +
          '</div>' +
        '</div>' +
        '<p style="color:var(--slate);font-size:14px;line-height:1.6;margin:16px 0;">This could mean your plan is inactive, your member ID needs updating, or your plan type differs. Don\'t worry — we can help.</p>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
          '<a href="tel:4077962406" class="payment-btn teal" style="flex:1;min-width:160px;text-align:center;">Call (407) 796-2406</a>' +
          '<a href="#book" class="payment-btn gold" style="flex:1;min-width:160px;text-align:center;">Book Anyway</a>' +
        '</div>' +
      '</div>';
    }

    function renderEligibilityError(container, errorMsg) {
      container.innerHTML = '<div class="elig-result elig-error">' +
        '<div class="elig-result-header">' +
          '<div class="elig-status-icon error">&#9432;</div>' +
          '<div><div class="elig-status-text" style="color:var(--slate);">Unable to Verify</div></div>' +
        '</div>' +
        '<p style="color:var(--slate);font-size:14px;line-height:1.6;margin:12px 0;">' + esc(errorMsg) + '</p>' +
        '<button class="payment-btn teal" style="margin-top:8px;" onclick="checkEligibility()">Try Again</button>' +
      '</div>';
    }

    // Booking flow: show/hide eligibility section
    function onBookingInsuranceChange(value) {
      var section = document.getElementById('bookingEligSection');
      if (!section) return;
      var skipValues = ['', 'Self-Pay / DPC Subscription', 'Other'];
      if (skipValues.indexOf(value) === -1) {
        section.style.display = 'block';
        if (window._eligCacheBooking && window._eligCacheBooking._insurance === value) {
          var resultsDiv = document.getElementById('bookingEligResults');
          renderBookingEligBadge(resultsDiv, window._eligCacheBooking);
          resultsDiv.style.display = 'block';
        }
      } else {
        section.style.display = 'none';
      }
    }

    // Booking flow: check eligibility inline
    function checkBookingEligibility() {
      if (rateLimited('bookingElig', 5000)) { alert('Please wait a few seconds before checking again.'); return; }
      var insurance = document.getElementById('bookingInsurance').value;
      var memberId = document.getElementById('bookingMemberId').value.trim();
      var form = document.getElementById('patientForm');
      var dob = form ? form.querySelector('input[name="dob"]').value : '';
      var firstName = form ? form.querySelector('input[name="firstName"]').value.trim() : '';
      var lastName = form ? form.querySelector('input[name="lastName"]').value.trim() : '';

      if (!memberId) { alert('Please enter your Member ID.'); return; }
      if (!dob) { alert('Please fill in your date of birth above first.'); return; }

      var btn = document.getElementById('bookingVerifyBtn');
      btn.disabled = true;
      btn.textContent = 'Checking...';

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'checkEligibility',
          insurance: insurance,
          memberId: memberId,
          dob: dob,
          firstName: firstName,
          lastName: lastName
        }),
        redirect: 'follow'
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        btn.disabled = false;
        btn.textContent = 'Verify Coverage';
        var resultsDiv = document.getElementById('bookingEligResults');
        if (data.success) {
          window._eligCacheBooking = data.eligibility;
          window._eligCacheBooking._insurance = insurance;
          renderBookingEligBadge(resultsDiv, data.eligibility);
        } else {
          resultsDiv.innerHTML = '<div class="elig-inline-error">' + esc(data.error) + '</div>';
        }
        resultsDiv.style.display = 'block';
      })
      .catch(function() {
        btn.disabled = false;
        btn.textContent = 'Verify Coverage';
      });
    }

    function renderBookingEligBadge(container, elig) {
      var mh = elig.mentalHealth;
      var html;
      if (elig.status === 'active') {
        html = '<div class="elig-booking-badge active"><span class="elig-badge-icon">&#10003;</span> <strong>Coverage Verified</strong>';
        if (mh.copay !== null) html += ' &mdash; Copay: $' + mh.copay;
        if (mh.coinsurance !== null) html += ', Coinsurance: ' + mh.coinsurance + '%';
        html += '</div>';
      } else {
        html = '<div class="elig-booking-badge inactive"><span class="elig-badge-icon">&#9888;</span> <strong>Coverage not confirmed</strong> &mdash; You can still book. We\'ll verify manually.</div>';
      }
      container.innerHTML = html;
    }

    function prefillBookingInsurance() {
      if (window.eligibilityResult) {
        var sel = document.getElementById('bookingInsurance');
        if (sel) {
          sel.value = window.eligibilityResult._insurance;
          onBookingInsuranceChange(sel.value);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── DYNAMIC TESTIMONIALS — Load approved reviews from API ───
    // ═══════════════════════════════════════════════════════════════
    (function() {
      var container = document.getElementById('testimonialContainer');
      if (!container || !APPS_SCRIPT_URL) return;

      fetch(APPS_SCRIPT_URL + '?action=getApprovedTestimonials')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.success || !data.testimonials || data.testimonials.length < 3) return;

          var testimonials = data.testimonials;
          var html = '';

          // Split into rows of 3
          for (var i = 0; i < testimonials.length; i++) {
            if (i % 3 === 0) {
              if (i > 0) html += '</div>';
              html += '<div class="test-grid"' + (i > 0 ? ' style="margin-top: 24px;"' : '') + '>';
            }

            var t = testimonials[i];
            var stars = '';
            for (var s = 0; s < 5; s++) {
              stars += s < t.rating ? '&#9733;' : '';
            }

            // Generate initials from display name
            var initials = '';
            var nameParts = (t.displayName || '').split(/\s+/);
            if (nameParts.length >= 2) {
              initials = nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
            } else if (nameParts.length === 1) {
              initials = nameParts[0].charAt(0).toUpperCase();
            }

            // Format date
            var dateStr = '';
            if (t.submittedAt) {
              var d = new Date(t.submittedAt);
              var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
              dateStr = months[d.getMonth()] + ' ' + d.getFullYear();
            }

            html += '<div class="test-card">' +
              '<div class="test-stars">' + stars + '</div>' +
              '<blockquote>"' + esc(t.text) + '"</blockquote>' +
              '<div class="test-author">' +
                '<div class="test-avatar">' + esc(initials) + '</div>' +
                '<div><div class="test-name">' + esc(t.displayName) + '</div><div class="test-role">' + esc(dateStr) + '</div></div>' +
              '</div>' +
            '</div>';
          }
          html += '</div>';

          container.innerHTML = html;
        })
        .catch(function() {
          // Silently keep hardcoded fallback
        });
    })();