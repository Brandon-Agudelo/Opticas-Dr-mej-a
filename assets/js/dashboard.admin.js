(function(){
  function ensureDashboardScript(){
    if (window.__dashboardLoaded) return;
    var s = document.createElement('script');
    s.src = 'assets/js/dashboard.js';
    s.defer = true;
    s.onload = function(){ window.__dashboardLoaded = true; initNavOverride(); };
    document.head.appendChild(s);
  }
  function initNavOverride(){
    var menu = document.querySelector('.menu');
    if (!menu) return;
    menu.addEventListener('click', function(e){
      var item = e.target.closest('.menu-item');
      if (!item) return;
      var href = item.getAttribute('href') || '';
      var base = href.replace(/#.*$/, '');
      var current = (location.pathname || '').split('/').pop() || '';
      var isCrossPage = base && base.length && base !== current;
      if (isCrossPage) { e.stopImmediatePropagation(); return; }
      e.preventDefault(); e.stopImmediatePropagation();
      var section = item.getAttribute('data-section') || 'resumen';
      if (section) { if (location.hash !== '#' + section) location.hash = '#' + section; }
    }, true);
  }
  ensureDashboardScript();
})();
