document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: solid background after scroll */
  var header = document.getElementById('site-header');
  var onScroll = function () {
    if (window.scrollY > 40) header.classList.add('solid');
    else header.classList.remove('solid');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile nav toggle */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* Scroll-reveal (fades in .reveal elements, staggers children of .reveal.stagger) */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Magnetic hover on primary buttons — subtle pull toward the cursor */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ======================================================================
     Live open/closed status — Red Flame keeps Kano (WAT, UTC+1, no DST) hours,
     11:00–22:00 daily, computed independently of the visitor's own timezone.
     ====================================================================== */
  function kanoStatus() {
    var now = new Date();
    var kanoHour = (now.getUTCHours() + 1) % 24;
    var kanoMin = now.getUTCMinutes();
    var minutesNow = kanoHour * 60 + kanoMin;
    var open = minutesNow >= 11 * 60 && minutesNow < 22 * 60;
    return {
      open: open,
      label: open ? 'Open now &middot; closes 10:00 PM' : 'Closed &middot; opens 11:00 AM'
    };
  }
  document.querySelectorAll('[data-status]').forEach(function (el) {
    var s = kanoStatus();
    el.classList.toggle('closed', !s.open);
    var textEl = el.querySelector('.status-text') || el;
    textEl.innerHTML = s.label;
  });

  /* ======================================================================
     Reservation modal
     ====================================================================== */
  var resModal = document.getElementById('reservationModal');
  if (resModal) {
    var resDate = document.getElementById('resDate');
    var resTime = document.getElementById('resTime');
    var resGuests = document.getElementById('resGuests');
    var resName = document.getElementById('resName');
    var resSubmit = document.getElementById('resSubmit');
    var resError = document.getElementById('resError');

    // default the date picker to today, minimum today
    var todayISO = new Date().toISOString().slice(0, 10);
    if (resDate) { resDate.min = todayISO; resDate.value = todayISO; }

    document.querySelectorAll('[data-reserve]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        resError.hidden = true;
        resModal.showModal();
      });
    });

    resSubmit.addEventListener('click', function () {
      if (!resDate.value || !resTime.value || !resGuests.value) {
        resError.hidden = false;
        return;
      }
      var dateObj = new Date(resDate.value + 'T00:00:00');
      var dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      var name = resName.value.trim();
      var msg = 'Hi, I\'d like to reserve a table at Red Flame.\n' +
        'Date: ' + dateStr + '\n' +
        'Time: ' + resTime.value + '\n' +
        'Party size: ' + resGuests.value +
        (name ? '\nName: ' + name : '');
      var url = 'https://wa.me/2348087090973?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener');
      resModal.close();
    });
  }

  /* ======================================================================
     Dish detail modal
     ====================================================================== */
  var dishModal = document.getElementById('dishModal');
  if (dishModal) {
    var dishImg = document.getElementById('dishModalImg');
    var dishName = document.getElementById('dishModalName');
    var dishPrice = document.getElementById('dishModalPrice');
    var dishDesc = document.getElementById('dishModalDesc');
    var dishStory = document.getElementById('dishModalStory');

    document.querySelectorAll('.card[data-dish]').forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      var openCard = function () {
        try {
          var d = JSON.parse(card.getAttribute('data-dish'));
          dishImg.src = d.img;
          dishImg.alt = d.alt || d.name;
          dishName.textContent = d.name;
          dishPrice.textContent = '\u20A6' + d.price;
          dishDesc.textContent = d.desc;
          dishStory.textContent = d.story;
          dishModal.showModal();
        } catch (err) { /* malformed data, ignore */ }
      };
      card.addEventListener('click', openCard);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(); }
      });
    });
  }

  /* ======================================================================
     Flame-wipe page transition
     ====================================================================== */
  var wipe = document.getElementById('pageWipe');
  if (wipe) {
    if (reduceMotion) {
      wipe.style.display = 'none';
    } else {
      requestAnimationFrame(function () { wipe.classList.add('wipe-reveal'); });
      document.querySelectorAll('a[href$=".html"]').forEach(function (link) {
        if (link.target === '_blank' || link.hasAttribute('data-reserve')) return;
        var href = link.getAttribute('href');
        if (!href || href.indexOf('http') === 0) return;
        link.addEventListener('click', function (e) {
          if (href === window.location.pathname.split('/').pop()) return;
          e.preventDefault();
          wipe.classList.remove('wipe-reveal');
          wipe.classList.add('wipe-cover');
          setTimeout(function () { window.location.href = href; }, 480);
        });
      });
    }
  }
});
