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
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a:not(#resToggle)').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* Resources dropdown: tap-to-open on mobile */
  var resToggle = document.getElementById('resToggle');
  var resDropdown = document.getElementById('resDropdown');
  if (resToggle && resDropdown) {
    resToggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 960) {
        e.preventDefault();
        resDropdown.classList.toggle('mobile-open');
      }
    });
  }

  /* Scroll-reveal */
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
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Stat counters */
  var statNums = document.querySelectorAll('.stat-num');
  if (statNums.length) {
    var animateStat = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion || isNaN(target)) {
        el.textContent = prefix + target + suffix;
        return;
      }
      var duration = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateStat(entry.target); statIo.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      statNums.forEach(function (el) { statIo.observe(el); });
    } else {
      statNums.forEach(animateStat);
    }
  }

  /* Hero search + filter bar -> redirect to Properties page with query params (demo behaviour) */
  var heroSearchForm = document.getElementById('heroSearchForm');
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      window.location.href = 'properties.html';
    });
  }

  /* Properties page: live filtering */
  var filterForm = document.getElementById('filterForm');
  if (filterForm) {
    var grid = document.getElementById('propertyGrid');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.property-card'));
    var noResults = document.getElementById('noResults');
    var resultsCount = document.getElementById('resultsCount');
    var searchInput = document.getElementById('filterSearch');
    var locationSelect = document.getElementById('filterLocation');
    var typeSelect = document.getElementById('filterType');
    var budgetSelect = document.getElementById('filterBudget');

    function applyFilters() {
      var q = searchInput.value.trim().toLowerCase();
      var loc = locationSelect.value;
      var type = typeSelect.value;
      var budget = budgetSelect.value;
      var visible = 0;

      cards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        var matchQ = !q || text.indexOf(q) !== -1;
        var matchLoc = !loc || card.getAttribute('data-location') === loc;
        var matchType = !type || card.getAttribute('data-type') === type;
        var matchBudget = !budget || card.getAttribute('data-budget') === budget;
        var show = matchQ && matchLoc && matchType && matchBudget;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      resultsCount.textContent = 'Showing ' + visible + ' ' + (visible === 1 ? 'property' : 'properties');
      noResults.classList.toggle('show', visible === 0);
      grid.style.display = visible === 0 ? 'none' : '';
    }

    filterForm.addEventListener('submit', function (e) { e.preventDefault(); applyFilters(); });
    [locationSelect, typeSelect, budgetSelect].forEach(function (el) {
      el.addEventListener('change', applyFilters);
    });
    searchInput.addEventListener('input', function () {
      clearTimeout(searchInput._t);
      searchInput._t = setTimeout(applyFilters, 200);
    });
  }

  /* Investment calculator */
  var calcPlots = document.getElementById('calcPlots');
  var calcPrice = document.getElementById('calcPrice');
  var calcEstate = document.getElementById('calcEstate');
  var calcTotal = document.getElementById('calcTotal');
  if (calcPlots && calcPrice && calcTotal) {
    function formatNaira(n) {
      return '\u20A6' + Math.round(n).toLocaleString('en-NG');
    }
    function recalc() {
      var plots = Math.max(1, parseInt(calcPlots.value, 10) || 1);
      var price = Math.max(0, parseFloat(calcPrice.value) || 0);
      calcTotal.textContent = formatNaira(plots * price);
    }
    calcPlots.addEventListener('input', recalc);
    calcPrice.addEventListener('input', recalc);
    if (calcEstate) {
      calcEstate.addEventListener('change', function () {
        if (calcEstate.value !== 'custom') {
          calcPrice.value = calcEstate.value;
        }
        recalc();
      });
    }
    recalc();
  }

  /* Gallery lightbox (property detail pages) */
  var galleryTiles = document.querySelectorAll('.gallery-tile');
  var lightbox = document.getElementById('lightbox');
  if (galleryTiles.length && lightbox) {
    var lbImg = document.getElementById('lightboxImg');
    var lbCounter = document.getElementById('lightboxCounter');
    var images = Array.prototype.map.call(
      document.querySelectorAll('.pd-gallery-strip img'),
      function (img) { return { src: img.getAttribute('src'), alt: img.getAttribute('alt') }; }
    );
    var uniqueImages = [];
    var seen = {};
    images.forEach(function (im) { if (!seen[im.src]) { seen[im.src] = true; uniqueImages.push(im); } });

    var current = 0;
    function openLightbox(index) {
      current = index % uniqueImages.length;
      updateLightbox();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function updateLightbox() {
      lbImg.src = uniqueImages[current].src;
      lbImg.alt = uniqueImages[current].alt;
      lbCounter.textContent = 'Photo ' + (current + 1) + ' of ' + uniqueImages.length;
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    galleryTiles.forEach(function (tile, i) {
      tile.addEventListener('click', function () {
        var idx = parseInt(tile.getAttribute('data-index'), 10) || 0;
        openLightbox(idx);
      });
    });
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', function () {
      current = (current - 1 + uniqueImages.length) % uniqueImages.length;
      updateLightbox();
    });
    document.getElementById('lightboxNext').addEventListener('click', function () {
      current = (current + 1) % uniqueImages.length;
      updateLightbox();
    });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
      if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
    });
  }

  /* Contact form -> success state (demo; no backend) */
  var contactForm = document.getElementById('contactForm');
  var contactSuccess = document.getElementById('contactSuccess');
  if (contactForm && contactSuccess) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactForm.style.display = 'none';
      contactSuccess.classList.add('show');
    });
  }
});
