/* ONA Store Finder — vanilla JS, one instance per section */
(function () {
  'use strict';

  const PAGE_SIZE = 12;

  const STYLE_ARRAY = [
    {elementType:"geometry",stylers:[{color:"#dedede"}]},
    {elementType:"labels.icon",stylers:[{visibility:"off"}]},
    {elementType:"labels.text.fill",stylers:[{color:"#616161"}]},
    {elementType:"labels.text.stroke",stylers:[{color:"#f5f5f5"}]},
    {featureType:"administrative.land_parcel",elementType:"labels.text.fill",stylers:[{color:"#bdbdbd"}]},
    {featureType:"poi",elementType:"geometry",stylers:[{color:"#eeeeee"}]},
    {featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#757575"}]},
    {featureType:"poi.park",elementType:"geometry",stylers:[{color:"#c9c9c9"}]},
    {featureType:"poi.park",elementType:"labels.text.fill",stylers:[{color:"#9e9e9e"}]},
    {featureType:"road",elementType:"geometry",stylers:[{color:"#ffffff"}]},
    {featureType:"road.arterial",elementType:"labels.text.fill",stylers:[{color:"#757575"}]},
    {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#9c9c9c"}]},
    {featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#616161"}]},
    {featureType:"road.local",elementType:"labels.text.fill",stylers:[{color:"#9e9e9e"}]},
    {featureType:"transit.line",elementType:"geometry",stylers:[{color:"#c7c7c7"}]},
    {featureType:"transit.station",elementType:"geometry",stylers:[{color:"#dedede"}]},
    {featureType:"water",elementType:"geometry",stylers:[{color:"#a3a3a3"}]},
    {featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#9e9e9e"}]}
  ];

  document.querySelectorAll('.ona-sf').forEach(initSection);

  function initSection(root) {
    const sectionId = root.dataset.sectionId;
    const cfg = (window.__onaSf || {})[sectionId] || {};
    const apiKey = cfg.apiKey;
    const fallbackLat = isFinite(cfg.fallbackLat) ? cfg.fallbackLat : -35.2809;
    const fallbackLng = isFinite(cfg.fallbackLng) ? cfg.fallbackLng : 149.1300;
    const markerIcon = cfg.markerIcon;

    const listEl = root.querySelector('[data-ona-sf-list]');
    const mapWrap = root.querySelector('[data-ona-sf-map-wrap]');
    const mapEl = mapWrap && mapWrap.querySelector('.ona-sf__map');
    const countEl = root.querySelector('[data-ona-sf-count]');
    const emptyEl = root.querySelector('[data-ona-sf-empty]');
    const searchInput = root.querySelector('.ona-sf__search');
    const nearMeBtn = root.querySelector('[data-ona-sf-near-me]');
    const layout = root.querySelector('[data-ona-sf-layout]');
    const cards = Array.from(root.querySelectorAll('[data-ona-sf-card]'));
    const distanceFilter = root.querySelector('[data-ona-sf-distance-filter]');
    const distanceSlider = root.querySelector('[data-ona-sf-distance-slider]');
    const distanceValueEl = root.querySelector('[data-ona-sf-distance-value]');
    const distanceAnchorEl = root.querySelector('[data-ona-sf-distance-anchor]');
    const distanceBubble = root.querySelector('[data-ona-sf-rs-bubble]');
    const paginationEl = root.querySelector('[data-ona-sf-pagination]');
    const pagePrevBtn = root.querySelector('[data-ona-sf-page-prev]');
    const pageNextBtn = root.querySelector('[data-ona-sf-page-next]');
    const pageListEl = root.querySelector('[data-ona-sf-page-list]');

    let activeTags = new Set();
    let userPos = null;
    let maxDistanceKm = Infinity;
    let currentPage = 1;
    let map = null;
    let mapInitPromise = null;
    let markers = new Map();
    let infoWindow = null;
    let mapBounds = null; // google.maps.LatLngBounds — when set, only stores within these bounds are visible
    let userPannedMap = false;
    let activeMarkerId = null; // ID of currently-clicked store — always kept visible

    function haversineKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
      return 2 * R * Math.asin(Math.sqrt(a));
    }

    function isValidCoord(lat, lng) {
      return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    function getCardData(card) {
      return {
        el: card,
        id: card.dataset.id,
        lat: parseFloat(card.dataset.lat),
        lng: parseFloat(card.dataset.lng),
        tags: (card.dataset.tags || '').split(',').filter(Boolean),
        searchText: card.dataset.searchText || '',
        title: card.querySelector('.ona-sf__card-title')?.textContent || '',
        address: card.querySelector('.ona-sf__card-address')?.textContent || '',
        hoursHtml: card.querySelector('.ona-sf__card-hours')?.innerHTML || '',
        directionsUrl: card.querySelector('.ona-sf__btn--primary')?.href || '',
        websiteUrl: card.querySelector('.ona-sf__btn:not(.ona-sf__btn--primary)')?.href || ''
      };
    }

    function isMapView() {
      return layout.getAttribute('data-view') === 'map';
    }

    function applyFilters(opts) {
      opts = opts || {};
      const tagSet = activeTags;
      let visibleAfterFilter = [];

      cards.forEach(card => {
        const d = getCardData(card);
        const matchTags = tagSet.size === 0 || d.tags.some(t => tagSet.has(t));
        let matchDistance = true;
        if (userPos && isFinite(maxDistanceKm) && maxDistanceKm < Infinity) {
          if (!isValidCoord(d.lat, d.lng)) {
            matchDistance = false;
          } else {
            matchDistance = haversineKm(userPos.lat, userPos.lng, d.lat, d.lng) <= maxDistanceKm;
          }
        }
        // Map viewport filter: when map has been interacted with (panned/zoomed/searched),
        // only show stores whose markers fall within current map bounds.
        // Exception: the actively-clicked marker stays visible regardless of bounds.
        let matchBounds = true;
        if (mapBounds && userPannedMap) {
          if (activeMarkerId && card.dataset.id === activeMarkerId) {
            matchBounds = true;
          } else if (!isValidCoord(d.lat, d.lng)) {
            matchBounds = false;
          } else {
            matchBounds = mapBounds.contains(new google.maps.LatLng(d.lat, d.lng));
          }
        }
        const match = !searchFailed && matchTags && matchDistance && matchBounds;
        card.dataset.matchFilter = match ? '1' : '0';
        if (match) visibleAfterFilter.push(card);
      });

      // sort by distance if applicable
      if (userPos) {
        visibleAfterFilter.sort((a, b) => {
          const da = getCardData(a), db = getCardData(b);
          const distA = isFinite(da.lat) ? haversineKm(userPos.lat, userPos.lng, da.lat, da.lng) : Infinity;
          const distB = isFinite(db.lat) ? haversineKm(userPos.lat, userPos.lng, db.lat, db.lng) : Infinity;
          return distA - distB;
        });
      }
      // On mobile only: force the actively-selected card to the front of the list
      // so it's always reachable at the top after the list re-renders. Desktop keeps natural sort order.
      if (activeMarkerId && isMobileViewport()) {
        const activeIdx = visibleAfterFilter.findIndex(c => c.dataset.id === activeMarkerId);
        if (activeIdx > 0) {
          const [active] = visibleAfterFilter.splice(activeIdx, 1);
          visibleAfterFilter.unshift(active);
        }
      }
      if (userPos || (activeMarkerId && isMobileViewport())) {
        visibleAfterFilter.forEach(c => listEl.appendChild(c));
      }
      if (userPos) {
        cards.forEach(card => {
          const d = getCardData(card);
          const distEl = card.querySelector('[data-ona-sf-distance]');
          if (distEl) {
            if (isFinite(d.lat) && isFinite(d.lng)) {
              const dist = haversineKm(userPos.lat, userPos.lng, d.lat, d.lng);
              distEl.textContent = (dist < 100 ? dist.toFixed(1) : Math.round(dist)) + ' km';
            } else {
              distEl.textContent = '';
            }
          }
        });
      }

      if (countEl) countEl.textContent = visibleAfterFilter.length + (visibleAfterFilter.length === 1 ? ' store' : ' stores');
      if (emptyEl) {
        emptyEl.hidden = visibleAfterFilter.length > 0;
        const emptySearchMsg = emptyEl.querySelector('[data-ona-sf-empty-search]');
        const emptyFilterMsg = emptyEl.querySelector('[data-ona-sf-empty-filter]');
        if (emptySearchMsg && emptyFilterMsg) {
          emptySearchMsg.hidden = !searchFailed;
          emptyFilterMsg.hidden = searchFailed;
        }
      }

      // Reset to page 1 unless preserving page
      if (!opts.preservePage) currentPage = 1;

      applyPagination(visibleAfterFilter);

      if (map) syncMarkers();
    }

    function isMobileViewport() {
      return window.matchMedia('(max-width: 999px)').matches;
    }
    function applyPagination(visibleAfterFilter) {
      const inMap = isMapView();
      // Paginate only in list view. Map view (both desktop and mobile) uses scrollable list.
      const shouldPaginate = !inMap;
      if (!shouldPaginate || visibleAfterFilter.length <= PAGE_SIZE) {
        visibleAfterFilter.forEach(c => { c.style.display = ''; });
        cards.forEach(c => { if (c.dataset.matchFilter !== '1') c.style.display = 'none'; });
        if (paginationEl) paginationEl.hidden = true;
        return;
      }
      const totalPages = Math.max(1, Math.ceil(visibleAfterFilter.length / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      cards.forEach(c => { c.style.display = 'none'; });
      visibleAfterFilter.slice(start, end).forEach(c => { c.style.display = ''; });

      if (paginationEl) {
        paginationEl.hidden = false;
        renderPageList(currentPage, totalPages);
        if (pagePrevBtn) pagePrevBtn.disabled = currentPage <= 1;
        if (pageNextBtn) pageNextBtn.disabled = currentPage >= totalPages;
      }
    }

    function renderPageList(current, total) {
      if (!pageListEl) return;
      // Build a compact list: 1 ... current-1 current current+1 ... total
      const items = new Set();
      items.add(1);
      items.add(total);
      for (let p = current - 1; p <= current + 1; p++) {
        if (p >= 1 && p <= total) items.add(p);
      }
      const sorted = Array.from(items).sort((a, b) => a - b);
      const html = [];
      let prev = 0;
      for (const p of sorted) {
        if (prev && p - prev > 1) {
          html.push('<li class="ona-sf__page-ellipsis">…</li>');
        }
        html.push(`<li class="${p === current ? 'is-active' : ''}"><button type="button" class="ona-sf__page-num" data-page="${p}">${p}</button></li>`);
        prev = p;
      }
      pageListEl.innerHTML = html.join('');
      pageListEl.querySelectorAll('.ona-sf__page-num').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = parseInt(btn.dataset.page, 10);
          applyFilters({preservePage: true});
          scrollToListTop();
        });
      });
    }

    function activateCard(id) {
      cards.forEach(c => c.classList.toggle('is-active', c.dataset.id === id));
      const target = cards.find(c => c.dataset.id === id);
      if (!target || target.style.display === 'none') return;
      // Scroll only inside the list container; target lands at the top of the scrollable area.
      const listRect = listEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = listEl.scrollTop + (targetRect.top - listRect.top);
      listEl.scrollTop = offset;
    }

    // Tag chips
    root.querySelectorAll('[data-ona-sf-tag]').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.onaSfTag;
        if (tag === '__all') {
          activeTags.clear();
          root.querySelectorAll('[data-ona-sf-tag]').forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
        } else {
          const allChip = root.querySelector('[data-ona-sf-tag="__all"]');
          if (allChip) allChip.classList.remove('is-active');
          if (activeTags.has(tag)) {
            activeTags.delete(tag);
            chip.classList.remove('is-active');
          } else {
            activeTags.add(tag);
            chip.classList.add('is-active');
          }
          if (activeTags.size === 0 && allChip) allChip.classList.add('is-active');
        }
        applyFilters();
      });
    });

    // Search input — Enter routes through the same unified geocodeAndUse flow as the button
    const searchClearBtn = root.querySelector('[data-ona-sf-search-clear]');
    function refreshSearchClearBtn() {
      if (!searchClearBtn) return;
      searchClearBtn.hidden = !(searchInput && searchInput.value);
    }
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;
        geocodeAndUse(q);
      });
      searchInput.addEventListener('input', refreshSearchClearBtn);
    }
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchFailed = false;
        refreshSearchClearBtn();
        applyFilters();
        if (searchInput) searchInput.focus();
      });
    }
    refreshSearchClearBtn();

    // Reset
    const resetBtn = root.querySelector('[data-ona-sf-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeTags.clear();
        if (searchInput) searchInput.value = '';
        searchFailed = false;
        userPannedMap = false;
        mapBounds = null;
        root.querySelectorAll('[data-ona-sf-tag]').forEach(c => c.classList.remove('is-active'));
        const allChip = root.querySelector('[data-ona-sf-tag="__all"]');
        if (allChip) allChip.classList.add('is-active');
        applyFilters();
      });
    }

    // Distance slider — visible always, but disabled until user position is known
    function computeMaxDistance(originLat, originLng) {
      let maxKm = 0;
      cards.forEach(card => {
        const d = getCardData(card);
        if (!isValidCoord(d.lat, d.lng)) return;
        const dist = haversineKm(originLat, originLng, d.lat, d.lng);
        if (dist > maxKm) maxKm = dist;
      });
      // Round up to nearest 100km, minimum 100
      return Math.max(100, Math.ceil(maxKm / 100) * 100);
    }
    function updateSliderTicks() {
      if (!distanceSlider) return;
      const ticksEl = root.querySelector('.ona-sf__rs-ticks');
      if (!ticksEl) return;
      const max = parseFloat(distanceSlider.max);
      const step = Math.ceil(max / 5 / 100) * 100; // ~5 ticks
      const values = [0];
      for (let v = step; v < max; v += step) values.push(v);
      values.push(max);
      ticksEl.innerHTML = values.map(v => `<span>${v} km</span>`).join('');
    }
    function updateSliderUI() {
      if (!distanceSlider) return;
      const min = parseFloat(distanceSlider.min);
      const max = parseFloat(distanceSlider.max);
      const val = parseFloat(distanceSlider.value);
      const pct = ((val - min) / (max - min)) * 100;
      const trackWrap = distanceSlider.parentElement;
      if (trackWrap) trackWrap.style.setProperty('--ona-sf-rs-pct', pct + '%');
      if (distanceFilter) distanceFilter.style.setProperty('--ona-sf-rs-pct', pct + '%');
      if (distanceBubble) distanceBubble.textContent = val + ' km';
      if (distanceValueEl) distanceValueEl.textContent = distanceSlider.value;
    }
    if (distanceSlider) {
      const initialMax = computeMaxDistance(fallbackLat, fallbackLng);
      distanceSlider.max = initialMax;
      distanceSlider.value = initialMax;
      updateSliderTicks();
      updateSliderUI();

      let isAnimating = false;
      let suppressInput = false;

      function applySliderChange() {
        maxDistanceKm = parseFloat(distanceSlider.value);
        if (!userPos) {
          userPos = {lat: fallbackLat, lng: fallbackLng};
          if (distanceFilter) distanceFilter.classList.add('is-active');
          if (distanceAnchorEl) distanceAnchorEl.textContent = 'Canberra';
        }
        updateSliderUI();
        applyFilters();
      }

      function animateThumbTo(from, to, duration) {
        if (isAnimating) return;
        isAnimating = true;
        const start = performance.now();
        function step(t) {
          const progress = Math.min((t - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          const value = Math.round(from + (to - from) * eased);
          suppressInput = true;
          distanceSlider.value = value;
          suppressInput = false;
          updateSliderUI();
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            isAnimating = false;
            applySliderChange();
          }
        }
        requestAnimationFrame(step);
      }

      // Intercept clicks on the track (not on the thumb) and animate instead of letting native snap
      distanceSlider.addEventListener('mousedown', e => {
        if (distanceSlider.disabled || isAnimating) return;
        const rect = distanceSlider.getBoundingClientRect();
        if (rect.width === 0) return;
        const min = parseFloat(distanceSlider.min);
        const max = parseFloat(distanceSlider.max);
        const currentValue = parseFloat(distanceSlider.value);
        const thumbX = ((currentValue - min) / (max - min)) * rect.width;
        const clickX = e.clientX - rect.left;
        const distFromThumb = Math.abs(clickX - thumbX);
        // 12 px tolerance around the thumb — within that, allow native drag
        if (distFromThumb <= 12) return;
        // Outside the thumb → cancel native jump, animate ourselves
        e.preventDefault();
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        const target = Math.round(min + pct * (max - min));
        animateThumbTo(currentValue, target, 260);
      });

      distanceSlider.addEventListener('input', () => {
        if (suppressInput || isAnimating) return;
        applySliderChange();
      });
    }

    // Pagination buttons
    function scrollToListTop() {
      // Measure the sticky header height directly; fall back to CSS vars.
      let headerOffset = 0;
      const stickyEls = document.querySelectorAll('header-component, header.shopify-section-header-sticky, header[data-sticky], #header-group');
      stickyEls.forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position === 'sticky' || cs.position === 'fixed' || el.tagName.toLowerCase() === 'header-component') {
          const r = el.getBoundingClientRect();
          if (r.top <= 0 && r.height > headerOffset) headerOffset = r.height;
        }
      });
      if (!headerOffset) {
        headerOffset = parseFloat(getComputedStyle(document.body).getPropertyValue('--header-group-height')) ||
                       parseFloat(getComputedStyle(document.body).getPropertyValue('--header-height')) || 80;
      }
      const top = listEl.getBoundingClientRect().top + window.pageYOffset - headerOffset - 16;
      window.scrollTo({top, behavior: 'smooth'});
    }
    if (pagePrevBtn) {
      pagePrevBtn.addEventListener('click', () => {
        currentPage--;
        applyFilters({preservePage: true});
        scrollToListTop();
      });
    }
    if (pageNextBtn) {
      pageNextBtn.addEventListener('click', () => {
        currentPage++;
        applyFilters({preservePage: true});
        scrollToListTop();
      });
    }

    // mode: 'search' (activate viewport filter) or 'search' (just distance-sort, no viewport filter)
    function setUserPos(lat, lng, label, mode) {
      userPos = {lat, lng};
      if (distanceFilter) distanceFilter.classList.add('is-active');
      if (distanceAnchorEl) distanceAnchorEl.textContent = label || 'your location';
      if (distanceSlider) {
        const newMax = computeMaxDistance(lat, lng);
        distanceSlider.max = newMax;
        distanceSlider.value = newMax;
        updateSliderTicks();
      }
      maxDistanceKm = parseFloat(distanceSlider ? distanceSlider.value : Infinity);
      updateSliderUI();

      if (mode === 'nearby') {
        // Distance-sort only — no viewport filter
        userPannedMap = false;
        mapBounds = null;
        if (map) {
          map.setCenter({lat, lng});
          map.setZoom(11);
        }
        applyFilters();
        return;
      }
      // 'search' mode — activate viewport filter (default)
      userPannedMap = true; // set synchronously so view-toggle's auto-fit skips
      ensureMap().then(() => {
        const N = 5;
        const distances = [];
        cards.forEach(card => {
          const d = getCardData(card);
          if (!isValidCoord(d.lat, d.lng)) return;
          distances.push({ lat: d.lat, lng: d.lng, dist: haversineKm(lat, lng, d.lat, d.lng) });
        });
        distances.sort((a, b) => a.dist - b.dist);
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({lat, lng});
        distances.slice(0, N).forEach(p => bounds.extend({lat: p.lat, lng: p.lng}));
        // Wait for layout so fitBounds uses correct container size
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            google.maps.event.trigger(map, 'resize');
            map.fitBounds(bounds, {top: 60, right: 60, bottom: 60, left: 60});
          });
        });
      });
      applyFilters();
    }
    function switchToMap() {
      const mapBtn = root.querySelector('[data-ona-sf-view="map"]');
      if (mapBtn && !mapBtn.classList.contains('is-active')) mapBtn.click();
    }
    let searchFailed = false;
    function isInAustralia(lat, lng) {
      // Rough AU bounding box including territories
      return lat >= -44 && lat <= -9 && lng >= 110 && lng <= 155;
    }
    function geocodeAndUse(query) {
      searchFailed = false;
      const q = query.trim().toLowerCase();
      // First try to match a store by title or address (text contains, case-insensitive)
      if (q) {
        for (const card of cards) {
          const title = (card.querySelector('.ona-sf__card-title')?.textContent || '').trim().toLowerCase();
          const searchText = card.dataset.searchText || '';
          if (title.includes(q) || searchText.includes(q)) {
            const d = getCardData(card);
            if (isValidCoord(d.lat, d.lng)) {
              switchToMap();
              setUserPos(d.lat, d.lng, d.title, 'search');
              return;
            }
          }
        }
      }
      loadGoogleMaps().then(() => {
        const RELIABLE_TYPES = new Set([
          'street_address', 'premise', 'route', 'intersection',
          'locality', 'sublocality', 'neighborhood', 'postal_code',
          'administrative_area_level_1', 'administrative_area_level_2',
          'administrative_area_level_3'
        ]);
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: query, componentRestrictions: { country: 'AU' } }, (results, status) => {
          if (status !== 'OK' || !results || !results[0]) {
            searchFailed = true;
            applyFilters();
            return;
          }
          const r = results[0];
          const types = r.types || [];
          const hasReliableType = types.some(t => RELIABLE_TYPES.has(t));
          const loc = r.geometry && r.geometry.location;
          if (!hasReliableType || !loc || !isInAustralia(loc.lat(), loc.lng())) {
            searchFailed = true;
            applyFilters();
            return;
          }
          switchToMap();
          setUserPos(loc.lat(), loc.lng(), r.formatted_address || query, 'search');
        });
      });
    }
    if (nearMeBtn) {
      nearMeBtn.addEventListener('click', () => {
        // If user typed something in the search box, treat the button as "Search"
        if (searchInput && searchInput.value.trim()) {
          geocodeAndUse(searchInput.value.trim());
          return;
        }
        if (!navigator.geolocation) {
          switchToMap();
          setUserPos(fallbackLat, fallbackLng, 'Canberra', 'search');
          return;
        }
        nearMeBtn.disabled = true;
        navigator.geolocation.getCurrentPosition(
          pos => { nearMeBtn.disabled = false; switchToMap(); setUserPos(pos.coords.latitude, pos.coords.longitude, 'your location', 'search'); },
          () => { nearMeBtn.disabled = false; switchToMap(); setUserPos(fallbackLat, fallbackLng, 'Canberra', 'search'); },
          { timeout: 8000 }
        );
      });
    }

    // View toggle
    layout.setAttribute('data-view', 'list');
    root.querySelectorAll('[data-ona-sf-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.onaSfView;
        root.querySelectorAll('[data-ona-sf-view]').forEach(b => b.classList.toggle('is-active', b === btn));
        layout.setAttribute('data-view', v);
        // Re-apply visibility (pagination off in map view, on in list view)
        applyFilters({preservePage: true});
        if (v === 'map') {
          ensureMap().then(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (!map) return;
                google.maps.event.trigger(map, 'resize');
                // Only auto-fit to all markers if the user hasn't already searched/panned.
                // Otherwise we'd clobber the search-induced bounds.
                if (!userPannedMap) {
                  fitToVisibleMarkers();
                }
              });
            });
          });
        }
      });
    });

    function loadGoogleMaps() {
      if (window.google && window.google.maps) return Promise.resolve();
      if (mapInitPromise) return mapInitPromise;
      mapInitPromise = new Promise((resolve, reject) => {
        const cbName = '__onaSfGmapsCb_' + Date.now();
        window[cbName] = () => { resolve(); delete window[cbName]; };
        const s = document.createElement('script');
        s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) + '&libraries=places&callback=' + cbName;
        s.async = true;
        s.defer = true;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      return mapInitPromise;
    }

    function ensureMap() {
      if (map) return Promise.resolve();
      return loadGoogleMaps().then(() => {
        map = new google.maps.Map(mapEl, {
          center: userPos || {lat: -25.2744, lng: 133.7751},
          zoom: userPos ? 11 : 4,
          minZoom: 3,
          maxZoom: 18,
          disableDefaultUI: true,
          zoomControl: true,
          styles: STYLE_ARRAY,
          restriction: {
            latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
            strictBounds: false
          }
        });
        const iwMaxWidth = isMobileViewport() ? Math.min(window.innerWidth - 40, 400) : 320;
        infoWindow = new google.maps.InfoWindow({maxWidth: iwMaxWidth});
        infoWindow.addListener('closeclick', () => {
          activeMarkerId = null;
          cards.forEach(c => c.classList.remove('is-active'));
          applyFilters({preservePage: true});
        });

        // Only USER interactions activate viewport filter (not programmatic fits)
        map.addListener('dragstart', () => { userPannedMap = true; });
        mapEl.addEventListener('wheel', () => { userPannedMap = true; }, {passive: true});
        mapEl.addEventListener('dblclick', () => { userPannedMap = true; });
        mapEl.addEventListener('touchstart', () => { userPannedMap = true; }, {passive: true});

        // After idle, update bounds and re-filter (debounced).
        // Skip the very first idle so the initial auto-fit doesn't get treated as a user pan.
        let idleCount = 0;
        let idleTimer = null;
        map.addListener('idle', () => {
          idleCount++;
          mapBounds = map.getBounds();
          if (idleCount === 1) return; // initial render — leave filter alone
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => applyFilters({preservePage: true}), 50);
        });

        syncMarkers();
        attachAutocomplete();
        return map;
      });
    }

    function buildInfoContent(d) {
      const directions = d.directionsUrl ? `<a href="${d.directionsUrl}" target="_blank" rel="noopener" class="ona-sf__iw-btn">Get directions</a>` : '';
      const website = d.websiteUrl ? `<a href="${d.websiteUrl}" target="_blank" rel="noopener" class="ona-sf__iw-btn ona-sf__iw-btn--secondary">Website</a>` : '';
      const hours = d.hoursHtml ? `<div class="ona-sf__iw-hours">${d.hoursHtml}</div>` : '';
      const actions = (directions || website) ? `<div class="ona-sf__iw-actions">${directions}${website}</div>` : '';
      return `<div class="ona-sf__iw"><h4>${escapeHtml(d.title)}</h4><div class="ona-sf__iw-body"><p>${escapeHtml(d.address)}</p>${hours}</div>${actions}</div>`;
    }

    function syncMarkers() {
      if (!map) return;
      cards.forEach(card => {
        const d = getCardData(card);
        const inFilter = card.dataset.matchFilter === '1';
        let m = markers.get(d.id);
        if (!m && inFilter && isValidCoord(d.lat, d.lng)) {
          m = new google.maps.Marker({
            position: {lat: d.lat, lng: d.lng},
            map,
            title: d.title,
            icon: markerIcon ? {
              url: markerIcon,
              scaledSize: new google.maps.Size(28, 38),
              anchor: new google.maps.Point(14, 38)
            } : undefined
          });
          m.addListener('click', () => {
            activeMarkerId = d.id;
            const iwW = isMobileViewport() ? Math.min(window.innerWidth - 40, 400) : 320;
            infoWindow.setOptions({maxWidth: iwW});
            infoWindow.setContent(buildInfoContent(d));
            infoWindow.open(map, m);
            cards.forEach(c => c.classList.toggle('is-active', c.dataset.id === d.id));
            applyFilters({preservePage: true});
            const target = cards.find(c => c.dataset.id === d.id);
            if (!target) return;
            if (isMobileViewport()) {
              // Mobile: card already at top, snap instantly
              listEl.scrollTop = 0;
            } else {
              // PC: card keeps its position; smooth-scroll within list so it lands at the top
              const offset = listEl.scrollTop + (target.getBoundingClientRect().top - listEl.getBoundingClientRect().top);
              listEl.scrollTo({top: offset, behavior: 'smooth'});
            }
          });
          markers.set(d.id, m);
        } else if (m) {
          m.setMap(inFilter ? map : null);
        }
      });
    }

    function fitToVisibleMarkers() {
      if (!map) return;
      const bounds = new google.maps.LatLngBounds();
      let any = false;
      markers.forEach(m => {
        if (m.getMap()) { bounds.extend(m.getPosition()); any = true; }
      });
      if (any) {
        map.fitBounds(bounds, {top: 60, right: 60, bottom: 60, left: 60});
      }
    }

    function attachAutocomplete() {
      if (!searchInput || !window.google?.maps?.places) return;
      if (searchInput.dataset.acAttached === '1') return;
      const ac = new google.maps.places.Autocomplete(searchInput, {
        componentRestrictions: { country: 'au' },
        fields: ['geometry', 'formatted_address', 'name']
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        const label = place.name || place.formatted_address || searchInput.value;
        const mapBtn = root.querySelector('[data-ona-sf-view="map"]');
        if (mapBtn && !mapBtn.classList.contains('is-active')) mapBtn.click();
        setUserPos(place.geometry.location.lat(), place.geometry.location.lng(), label, 'search');
      });
      searchInput.dataset.acAttached = '1';
    }

    cards.forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('a, button')) return;
        // Only act on card click in map view (sync card → pin). In list view do nothing.
        if (!isMapView()) return;
        const id = card.dataset.id;
        activateCard(id);
        if (map) {
          const m = markers.get(id);
          if (m) google.maps.event.trigger(m, 'click');
        }
      });
    });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    loadGoogleMaps().then(attachAutocomplete).catch(() => {});

    // Re-apply pagination when crossing mobile/desktop breakpoint
    let lastIsMobile = isMobileViewport();
    window.addEventListener('resize', () => {
      const nowMobile = isMobileViewport();
      if (nowMobile !== lastIsMobile) {
        lastIsMobile = nowMobile;
        applyFilters({preservePage: true});
      }
    });

    applyFilters();

    // Auto-attempt geolocation on first load. If user denies / times out, leave userPos null
    // (slider will fall back to Canberra only when user actively drags it).
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos(pos.coords.latitude, pos.coords.longitude, 'your location', 'nearby'),
        () => {},
        { timeout: 6000, maximumAge: 600000 }
      );
    }
  }
})();
