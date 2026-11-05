/* Bugema University Payroll System - behaviour
   Mobile menu, home slider, contact validation, payroll calculation, payslip, summary. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ugx(n) { return Math.round(n).toLocaleString('en-US'); }

  /* ---------- Payroll rules (match services.html) ---------- */
  function paye(gross) {
    var t = 0;
    if (gross > 410000) t = 25000 + 0.3 * (gross - 410000);
    else if (gross > 335000) t = 10000 + 0.2 * (gross - 335000);
    else if (gross > 235000) t = 0.1 * (gross - 235000);
    if (gross > 10000000) t += 0.1 * (gross - 10000000);
    return t;
  }
  function calculate(i) {
    var gross = i.basic + i.housing + i.transport + i.other;
    var nssf = gross * 0.05;
    var tax = paye(gross);
    var deductions = nssf + tax + i.ded;
    return { gross: gross, nssf: nssf, paye: tax, other: i.ded, deductions: deductions, net: gross - deductions };
  }
  window.PayrollCalc = { paye: paye, calculate: calculate };

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn'), menu = $('#menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      menuBtn.setAttribute('aria-expanded', String(menu.classList.toggle('open')));
    });
  }

  /* ---------- Home slider ---------- */
  var slider = $('.slider');
  if (slider) {
    var slides = $$('.slide', slider), dots = $$('.dot', slider);
    var pauseBtn = $('.pause', slider), idx = 0, timer = null, paused = false;
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
    };
    var start = function () { stop(); if (!paused) timer = setInterval(function () { if (!slider.matches(':hover')) show(idx + 1); }, 2000); };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    $('.prev', slider).addEventListener('click', function () { show(idx - 1); start(); });
    $('.next', slider).addEventListener('click', function () { show(idx + 1); start(); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); start(); }); });
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Play' : 'Pause';
        pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
        if (paused) stop(); else start();
      });
    }
    start();
  }

  /* ---------- Vacancy pop-up (home page) ---------- */
  var vac = $('#vacancyModal');
  if (vac) {
    var vacClose = $('#vacClose'), lastFocus = null;
    var closeVac = function () {
      vac.hidden = true;
      try { sessionStorage.setItem('bu-vacancy-seen', '1'); } catch (e) { /* ignore */ }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    var openVac = function () { lastFocus = document.activeElement; vac.hidden = false; vacClose.focus(); };
    vacClose.addEventListener('click', closeVac);
    vac.addEventListener('click', function (e) { if (e.target === vac) closeVac(); });
    document.addEventListener('keydown', function (e) {
      if (vac.hidden) return;
      if (e.key === 'Escape') closeVac();
      if (e.key === 'Tab') {
        var f = $$('a,button', vac);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var seen = false;
    try { seen = sessionStorage.getItem('bu-vacancy-seen') === '1'; } catch (e) { /* ignore */ }
    if (!seen) setTimeout(openVac, 600);
  }

  /* ---------- Shared form helpers ---------- */
  function errBox(input) {
    var label = input.closest('label');
    var n = label && label.nextElementSibling;
    return n && n.classList.contains('err') ? n : null;
  }
  function setErr(input, msg) {
    var b = errBox(input);
    if (b) b.textContent = msg || '';
    input.classList.toggle('bad', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validateField(input) {
    var v = input.value.trim(), msg = '';
    if (input.required && !v) msg = 'This field is required.';
    else if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Enter a valid email address.';
    else if (input.minLength > 0 && v && v.length < input.minLength) msg = 'Please enter at least ' + input.minLength + ' characters.';
    else if (input.type === 'number' && v !== '') {
      var n = Number(v);
      if (isNaN(n)) msg = 'Enter a number.';
      else if (input.min !== '' && n < Number(input.min)) msg = 'Value cannot be less than ' + input.min + '.';
    }
    setErr(input, msg);
    return !msg;
  }
  function validateForm(form) {
    var ok = true, first = null;
    $$('input,textarea,select', form).forEach(function (el) {
      if (!validateField(el)) { ok = false; if (!first) first = el; }
    });
    if (first) first.focus();
    return ok;
  }
  function liveValidate(form) {
    form.addEventListener('blur', function (e) {
      if (e.target.matches && e.target.matches('input,textarea,select')) validateField(e.target);
    }, true);
    form.addEventListener('input', function (e) {
      if (e.target.classList && e.target.classList.contains('bad')) validateField(e.target);
    });
  }

  /* ---------- Contact form (demonstration only) ---------- */
  var contact = $('#contactForm');
  if (contact) {
    liveValidate(contact);
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(contact)) return;
      contact.reset();
      var ok = $('#contactOk');
      if (ok) { ok.hidden = false; ok.scrollIntoView({ block: 'nearest' }); }
    });
  }

  /* ---------- Payroll page ---------- */
  var payForm = $('#payForm');
  if (payForm) {
    var KEY = 'bu-payroll-records';
    var records = [];
    try { records = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(records)) records = []; } catch (e) { records = []; }
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(records)); } catch (e) { /* storage unavailable */ } };

    var slipBox = $('#payslip'), printBtn = $('#printBtn'), searchBox = $('#search');
    var tbody = $('#summary tbody'), tfoot = $('#summary tfoot');

    var monthLabel = function (m) {
      if (!/^\d{4}-\d{2}$/.test(m)) return m || '';
      var d = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1);
      return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    };

    var renderSlip = function (r) {
      var row = function (k, v, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + k + '</td><td class="num">' + ugx(v) + '</td></tr>'; };
      slipBox.innerHTML =
        '<h3>Payslip: ' + esc(monthLabel(r.month)) + '</h3>' +
        '<p><strong>' + esc(r.name) + '</strong><br>ID ' + esc(r.id) + ' &middot; ' + esc(r.dept) + ' &middot; ' + esc(r.title) + '</p>' +
        '<table><thead><tr><th>Earnings</th><th class="num">UGX</th></tr></thead><tbody>' +
        row('Basic salary', r.basic) + row('Housing allowance', r.housing) + row('Transport allowance', r.transport) +
        row('Other allowances', r.other) + row('<strong>Gross pay</strong>', r.gross) + '</tbody></table>' +
        '<table><thead><tr><th>Deductions</th><th class="num">UGX</th></tr></thead><tbody>' +
        row('NSSF (5%)', r.nssf) + row('PAYE', r.paye) + row('Loan, advance or other', r.ded) +
        row('<strong>Total deductions</strong>', r.deductions) + '</tbody></table>' +
        '<table><tbody>' + row('Net pay', r.net, 'net') + '</tbody></table>';
      if (printBtn) printBtn.hidden = false;
    };

    var renderTable = function () {
      var q = searchBox ? searchBox.value.trim().toLowerCase() : '';
      var list = records.filter(function (r) {
        return !q || (r.name + ' ' + r.id + ' ' + r.dept).toLowerCase().indexOf(q) !== -1;
      });
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="muted">' + (records.length ? 'No employees match your search.' : 'No payroll records yet.') + '</td></tr>';
        tfoot.innerHTML = '';
        return;
      }
      var g = 0, d = 0, n = 0;
      tbody.innerHTML = list.map(function (r) {
        g += r.gross; d += r.deductions; n += r.net;
        return '<tr><td>' + esc(r.name) + '<br><span class="muted">' + esc(r.id) + ' &middot; ' + esc(r.dept) + '</span></td>' +
          '<td>' + esc(monthLabel(r.month)) + '</td><td class="num">' + ugx(r.gross) + '</td>' +
          '<td class="num">' + ugx(r.deductions) + '</td><td class="num">' + ugx(r.net) + '</td>' +
          '<td><button type="button" data-act="view" data-uid="' + esc(r.uid) + '">View</button>' +
          '<button type="button" data-act="del" data-uid="' + esc(r.uid) + '">Delete</button></td></tr>';
      }).join('');
      tfoot.innerHTML = '<tr><td colspan="2">Total (' + list.length + ' employee' + (list.length === 1 ? '' : 's') + ')</td><td class="num">' +
        ugx(g) + '</td><td class="num">' + ugx(d) + '</td><td class="num">' + ugx(n) + '</td><td></td></tr>';
    };

    liveValidate(payForm);
    payForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(payForm)) return;
      var f = payForm.elements, num = function (k) { return Number(f[k].value) || 0; };
      var input = { basic: num('basic'), housing: num('housing'), transport: num('transport'), other: num('other'), ded: num('ded') };
      var c = calculate(input);
      var rec = {
        uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: f.name.value.trim(), id: f.id.value.trim(), dept: f.dept.value.trim(), title: f.title.value.trim(), month: f.month.value,
        basic: input.basic, housing: input.housing, transport: input.transport, other: input.other, ded: input.ded,
        gross: c.gross, nssf: c.nssf, paye: c.paye, deductions: c.deductions, net: c.net
      };
      records.push(rec);
      save();
      renderSlip(rec);
      renderTable();
      payForm.reset();
      $$('.bad', payForm).forEach(function (el) { el.classList.remove('bad'); });
      slipBox.scrollIntoView({ block: 'nearest' });
    });

    tbody.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]');
      if (!b) return;
      var uid = b.getAttribute('data-uid');
      if (b.getAttribute('data-act') === 'view') {
        var r = records.filter(function (x) { return x.uid === uid; })[0];
        if (r) { renderSlip(r); slipBox.scrollIntoView({ block: 'nearest' }); }
      } else {
        records = records.filter(function (x) { return x.uid !== uid; });
        save(); renderTable();
      }
    });

    if (searchBox) searchBox.addEventListener('input', renderTable);
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
    var clearBtn = $('#clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (!records.length || !window.confirm('Delete all payroll records stored in this browser?')) return;
      records = []; save(); renderTable();
      slipBox.innerHTML = '<p class="muted">Calculate an employee’s pay to see the payslip here.</p>';
      if (printBtn) printBtn.hidden = true;
    });

    renderTable();
  }
})();
