
// Interacciones básicas del dashboard (navegación entre secciones)
(async function () {
  const main = document.getElementById('main');
  if (!main) return;

  try { if (typeof window !== 'undefined') window.API_ENABLED = false; } catch {}

  // Eliminado modo demo/seed: no se manipula localStorage por query params

  // ---------- Store ----------
  const Store = {
    load() {
      try {
        const raw = localStorage.getItem('opticas_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          const base = { proveedores: [], ordenes: [], pagos: [], notificaciones: [], sedes: [], usuarios: [], roles: [] };
          return { ...base, ...(parsed || {}) };
        }
      } catch {}
      return { proveedores: [], ordenes: [], pagos: [], notificaciones: [], sedes: [], usuarios: [], roles: [] };
    },
    save(d) {
      try { localStorage.setItem('opticas_data', JSON.stringify(d || {})); } catch {}
    },
  };
  // Utilidad para saber si la estructura está vacía
  function isEmptyData(d) {
    return ['proveedores','ordenes','pagos','notificaciones','sedes','usuarios']
      .every(k => Array.isArray(d[k]) && d[k].length === 0);
  }
  let data = Store.load();

  // Intentar cargar datos desde el backend si está disponible
  async function loadRemoteData() {
    try {
      if (!window.Api || !window.Api.isEnabled()) return null;
      const [proveedores, ordenes, pagos, sedes, usuarios, roles] = await Promise.all([
        window.Api.get('/api/providers'),
        window.Api.get('/api/orders'),
        window.Api.get('/api/payments'),
        window.Api.get('/api/headquarters').catch(() => []),
        window.Api.get('/api/users').catch(() => []),
        window.Api.get('/api/roles').catch(() => []),
      ]);
      const remote = {
        proveedores: Array.isArray(proveedores) ? proveedores : [],
        ordenes: Array.isArray(ordenes) ? ordenes : [],
        pagos: Array.isArray(pagos) ? pagos : [],
        sedes: Array.isArray(sedes) ? sedes : [],
        usuarios: Array.isArray(usuarios) ? usuarios : [],
        roles: Array.isArray(roles) ? roles : [],
        notificaciones: Array.isArray([]),
      };
      return remote;
    } catch (_) {
      return null;
    }
  }
  // Intentar cargar del backend; si no hay datos, inicializar con demo local
  try {
    const remote = await loadRemoteData();
    if (remote && !isEmptyData(remote)) {
      data = remote;
      Store.save(data);
    } else if (!isEmptyData(data)) {
      data = data;
    } else {
      const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0,10);
      data = {
        proveedores: [
          { id: 1, nit: '900123', name: 'Laboratorio Alfa', email: 'alfa@lab.com', phone: '3000000000', address: 'Bogotá' },
          { id: 2, nit: '900456', name: 'Laboratorio Beta', email: 'beta@lab.com', phone: '3010000000', address: 'Medellín' },
        ],
        ordenes: [
          { id: 101, number: '101', patientName: 'Juan Pérez', documentPatient: '12345678', idProvider: 1, shippingDate: d(0), state: 'CREATED', paid: false, createdAt: Date.now() - 3600 },
          { id: 102, number: '102', patientName: 'María López', documentPatient: '98765432', idProvider: 2, shippingDate: d(1), state: 'SENT', paid: false, createdAt: Date.now() - 7200 },
          { id: 103, number: '103', patientName: 'Carlos Ruiz', documentPatient: '55555555', idProvider: 1, shippingDate: d(2), state: 'RECEIVED', paid: false, createdAt: Date.now() - 10800 },
          { id: 104, number: '104', patientName: 'Ana Gómez', documentPatient: '22223333', idProvider: 2, shippingDate: d(3), state: 'COMPLETED', paid: true, createdAt: Date.now() - 14400 },
        ],
        pagos: [
          { id: 'p1', ordenId: 104, proveedorId: 2, monto: 120000, fecha: d(3), comprobante: 'REC-001' },
        ],
        sedes: [], usuarios: [], roles: [], notificaciones: [],
      };
      Store.save(data);
    }
  } catch {}

  function seedDefaultSedesIfEmpty() {
    if (!Array.isArray(data.sedes) || data.sedes.length === 0) {
      data.sedes = [
        { id: 1,  name: 'Centro 3', dept: 'Meta' },
        { id: 2,  name: 'Primavera', dept: 'Meta' },
        { id: 3,  name: 'Viva', dept: 'Meta' },
        { id: 4,  name: 'Centauros', dept: 'Meta' },
        { id: 5,  name: 'Acacias', dept: 'Meta' },
        { id: 6,  name: 'Granada', dept: 'Meta' },
        { id: 7,  name: 'Catedral', dept: 'Meta' },
        { id: 8,  name: 'San Marin', dept: 'Meta' },
        { id: 9,  name: 'San Jose', dept: 'Meta' },
        { id: 10, name: 'Restrepo', dept: 'Meta' },
        { id: 11, name: 'Pto Lopez', dept: 'Meta' },
        { id: 12, name: 'Cumaral', dept: 'Meta' },
        { id: 13, name: 'Pto Gaitan', dept: 'Meta' },
        { id: 14, name: 'Yopal Principal', dept: 'Casanare' },
        { id: 15, name: 'Aguz Azul', dept: 'Casanare' },
        { id: 16, name: 'Villanueva', dept: 'Casanare' },
        { id: 17, name: 'Yopal Unicentro', dept: 'Casanare' },
        { id: 18, name: 'Paz', dept: 'Casanare' },
        { id: 19, name: 'Tauramena', dept: 'Casanare' },
      ];
      try { Store.save(data); } catch {}
    }
  }
  seedDefaultSedesIfEmpty();

  // ---------- Role ----------
  const roleSelector = document.getElementById('roleSelector');
  function getRole() { return localStorage.getItem('auth_role') || sessionStorage.getItem('auth_role') || 'assistant'; }
  function isAllowedForRole(el, role) {
    if (!el) return false;
    const attr = el.getAttribute('data-roles');
    if (!attr) return true; // si no se especifica, se permite por defecto
    const allowed = attr.split(',').map(s => s.trim());
    return allowed.includes(role);
  }
  function setRoleUI(role) {
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowed = el.getAttribute('data-roles').split(',').map(s => s.trim());
      el.toggleAttribute('hidden', !allowed.includes(role));
    });
    ensureSectionAllowed();
    try { renderNotificaciones(); } catch {}
    try { localStorage.setItem('tab_ordenes', '#listaOrdenes'); } catch {}
    try { const fm = document.getElementById('formOrden'); if (fm) fm.hidden = true; } catch {}
  }
  if (roleSelector) {
    roleSelector.value = getRole();
    roleSelector.addEventListener('change', () => {
      const val = roleSelector.value;
      localStorage.setItem('auth_role', val);
      setRoleUI(val);
    });
    setRoleUI(roleSelector.value);
  }

  // Eliminado botón de reinicio de demo

  // ---------- Sidebar toggle ----------
  const appLayout = document.querySelector('.app-layout');
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  const scrim = document.getElementById('appScrim');
  function syncToggleIcon(collapsed) {
    const iconEl = toggleSidebarBtn ? toggleSidebarBtn.querySelector('iconify-icon') : null;
    if (iconEl) iconEl.setAttribute('icon', collapsed ? 'ph:list' : 'ph:x');
  }
  function applySidebarCollapsed(collapsed) {
    if (!appLayout) return;
    appLayout.classList.toggle('collapsed', !!collapsed);
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
    syncToggleIcon(!!collapsed);
    // Si hay charts, intenta ajustar tamaño
    try {
      setTimeout(() => {
        if (window.Chart && window.charts) {
          Object.values(window.charts).forEach(ch => ch && ch.resize && ch.resize());
        }
      }, 60);
    } catch {}
    // Overlay en móvil cuando el sidebar está expandido
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    if (scrim) {
      const show = !collapsed && isMobile;
      scrim.classList.toggle('visible', show);
    }
  }
  const savedCollapsed = localStorage.getItem('sidebar_collapsed') === '1';
  const isMobileInit = window.matchMedia('(max-width: 960px)').matches;
  // En desktop, forzar expandido (no colapsado) al cargar
  applySidebarCollapsed(isMobileInit ? savedCollapsed : false);
  if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => applySidebarCollapsed(!appLayout.classList.contains('collapsed')));
  if (scrim) scrim.addEventListener('click', () => applySidebarCollapsed(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && scrim && scrim.classList.contains('visible')) applySidebarCollapsed(true); });
  window.addEventListener('resize', () => {
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    // En desktop mantener expandido; en móvil respetar estado actual
    if (!isMobile) {
      applySidebarCollapsed(false);
    } else {
      const collapsed = appLayout?.classList.contains('collapsed');
      applySidebarCollapsed(!!collapsed);
    }
  });

  // ---------- KPIs y gráfico ----------
  function updateKPIsAndChart() {
    const kEnviadas = document.getElementById('kpiOrdenesEnviadas');
    const kPendientes = document.getElementById('kpiPendientes');
    const kPagosPend = document.getElementById('kpiPagosPendientes');
    if (kEnviadas) kEnviadas.textContent = String(data.ordenes.length);
    if (kPendientes) kPendientes.textContent = String(data.ordenes.filter(o => {
      const st = getOrderState(o);
      return st !== 'COMPLETED' && st !== 'CANCELLED';
    }).length);
    if (kPagosPend) kPagosPend.textContent = String(data.ordenes.filter(o => !getOrderPaid(o)).length);
    updateCharts();
  }

  // ---------- Charts (Chart.js) ----------
  const charts = { estados: null, pagos: null, reportPagos: null, reportEstados: null };
  window.charts = charts;
  function updateCharts() {
    // Estados de órdenes (bar)
    const estadosEl = document.getElementById('chartEstadosCanvas');
    if (estadosEl && typeof Chart !== 'undefined') {
      const labels = ['CREATED','SENT','IN_PROGRESS','RETURN_ROUTE','RECEIVED','CANCELLED'];
      const counts = labels.map(e => data.ordenes.filter(o => String(getOrderState(o)).toUpperCase() === e).length);
      if (!charts.estados) {
        charts.estados = new Chart(estadosEl, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Órdenes',
              data: counts,
              backgroundColor: [
                'rgba(59,130,246,0.6)',
                'rgba(99,102,241,0.6)',
                'rgba(245,158,11,0.6)',
                'rgba(234,179,8,0.6)',
                'rgba(139,92,246,0.6)',
                'rgba(107,114,128,0.6)'
              ],
              borderRadius: 8,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
      } else {
        charts.estados.data.datasets[0].data = counts;
        charts.estados.data.labels = labels;
        charts.estados.update();
      }
    }

    // Flujo de pagos últimos 7 días (line)
    const pagosEl = document.getElementById('chartPagosCanvas');
    if (pagosEl && typeof Chart !== 'undefined') {
      const now = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(now.getDate() - (6 - i));
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      });
      const labels = days.map(d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`);
      const sums = days.map(d => {
        const dayStart = d.getTime();
        const dayEnd = dayStart + 24*60*60*1000;
        return data.pagos.filter(p => p.fecha >= dayStart && p.fecha < dayEnd).reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
      });
      if (!charts.pagos) {
        charts.pagos = new Chart(pagosEl, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Pagos',
              data: sums,
              borderColor: 'rgba(34,209,238,0.9)',
              backgroundColor: 'rgba(34,209,238,0.25)',
              tension: 0.35,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      } else {
        charts.pagos.data.labels = labels;
        charts.pagos.data.datasets[0].data = sums;
        charts.pagos.update();
      }
    }
  }

  // ---------- Pagos ----------
  const listaPagos = document.getElementById('listaPagos');
  const formPago = document.getElementById('formPago');
  const btnNuevoPago = document.getElementById('btnNuevoPago');
  const cancelPago = document.getElementById('cancelPago');
  const pagoOrdenSelect = document.getElementById('pagoOrden');
  const pagoMontoInput = document.getElementById('pagoMonto');
  const pagoComprobanteInput = document.getElementById('pagoComprobante');
  const pagoComprobanteFileInput = document.getElementById('pagoComprobanteFile');

  function fechaCorta(ts) {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  function refreshOrdenOptionsForPagos() {
    if (!pagoOrdenSelect) return;
    pagoOrdenSelect.innerHTML = '';
    // Prioriza órdenes no pagadas
    const pendientes = data.ordenes.filter(o => !getOrderPaid(o));
    const arr = pendientes.length ? pendientes : data.ordenes;
    arr.forEach(o => {
      const opt = document.createElement('option');
      opt.value = String(o.id);
      opt.textContent = `#${o.number || o.id} · ${getOrderPatientDisplay(o)} · ${providerNameById(getOrderProviderId(o))}`;
      pagoOrdenSelect.appendChild(opt);
    });
  }

  function renderPagos() {
    if (!listaPagos) return;
    listaPagos.innerHTML = '';
    
    // Filtros
    const search = document.getElementById('filtroPagoBusqueda')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('filtroPagoFecha')?.value || '';

    let pagos = Array.isArray(data.pagos) ? data.pagos : [];
    
    // Filtrar
    pagos = pagos.filter(p => {
        if (dateFilter) {
            const d = new Date(p.fecha).toISOString().slice(0,10);
            if (d !== dateFilter) return false;
        }
        if (search) {
            const orden = data.ordenes.find(o => Number(o.id) === Number(p.ordenId));
            const patient = orden ? getOrderPatientDisplay(orden).toLowerCase() : '';
            const matchId = String(p.ordenId).includes(search);
            const matchRef = (p.comprobante || '').toLowerCase().includes(search);
            const matchPatient = patient.includes(search);
            if (!matchId && !matchRef && !matchPatient) return false;
        }
        return true;
    });

    // Sort: newest first
    pagos.sort((a,b) => b.fecha - a.fecha);

    // Summary
    const totalShown = pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
    const summary = document.createElement('div');
    summary.style.padding = '8px 12px'; summary.style.fontWeight = 'bold'; summary.style.color = 'var(--c-primary)';
    summary.textContent = `Mostrando ${pagos.length} pagos. Total: $ ${new Intl.NumberFormat('es-CO').format(totalShown)}`;
    listaPagos.appendChild(summary);

    const gridTemplate = '80px 1fr 120px 100px 120px 140px';
    const head = document.createElement('div'); 
    head.className = 'table-row table-head'; 
    head.style.gridTemplateColumns = gridTemplate;
    head.innerHTML = '<div>Orden</div><div>Paciente</div><div>Monto</div><div>Fecha</div><div>Ref</div><div>Acciones</div>';
    listaPagos.appendChild(head);

    if (pagos.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay pagos registrados con estos filtros.';
      listaPagos.appendChild(empty);
    } else {
      pagos.forEach((p, idx) => {
        const row = document.createElement('div'); 
        row.className = 'table-row'; 
        row.style.gridTemplateColumns = gridTemplate;
        
        const orden = data.ordenes.find(o => Number(o.id) === Number(p.ordenId));
        const patientName = orden ? getOrderPatientDisplay(orden) : '-';
        
        const verBtnHtml = p.comprobanteArchivo ? `<button class="btn-outline btn-sm" data-view="${p.id}" title="Ver comprobante"><iconify-icon icon="ph:paperclip"></iconify-icon></button>` : '';
        const accionesHtml = `<div class="acciones">${verBtnHtml}<button class="btn-outline btn-sm" data-del="${p.id}" title="Eliminar"><iconify-icon icon="ph:trash"></iconify-icon> <span class="label">Eliminar</span></button></div>`;
        
        row.innerHTML = `<div>#${p.ordenId}</div><div>${patientName}</div><div>$${Number(p.monto).toFixed(2)}</div><div>${fechaCorta(p.fecha)}</div><div>${p.comprobante || '-'}</div>${accionesHtml}`;
        
        const delBtn = row.querySelector('button[data-del]');
        if (delBtn) delBtn.addEventListener('click', async () => {
          if(!confirm('¿Eliminar este pago?')) return;
          const ordenId = p.ordenId;
          const ordIdx = data.ordenes.findIndex(o => o.id === ordenId);
          if (ordIdx >= 0) data.ordenes[ordIdx].pagada = false;
          
          const realIdx = data.pagos.findIndex(x => x.id === p.id);
          if(realIdx > -1) data.pagos.splice(realIdx, 1);
          Store.save(data);
          renderPagos(); updateKPIsAndChart(); try{renderOrdenes();}catch{}
          
          try {
            if (window.Api && window.Api.isEnabled()) {
              await window.Api.del(`/api/payments/${encodeURIComponent(p.id)}`);
              if (ordIdx >= 0) await window.Api.patch(`/api/orders/${encodeURIComponent(ordenId)}`, { paid: false });
            }
          } catch (_) {}
        });

        const viewBtn = row.querySelector('button[data-view]');
        if (viewBtn) viewBtn.addEventListener('click', () => {
          const url = p.comprobanteArchivo?.dataUrl;
          if (url) {
            const a = document.createElement('a');
            a.href = url; a.target = '_blank'; a.rel = 'noopener';
            a.download = p.comprobanteArchivo.name || 'comprobante';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
        });
        listaPagos.appendChild(row);
      });
    }
  }
  
  // Listeners para filtros de pagos
  ['filtroPagoBusqueda', 'filtroPagoFecha'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.addEventListener('input', renderPagos);
  });
  const btnLimpiarPagos = document.getElementById('limpiarFiltrosPagos');
  if(btnLimpiarPagos) btnLimpiarPagos.addEventListener('click', () => {
      ['filtroPagoBusqueda', 'filtroPagoFecha'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
      renderPagos();
  });

  const pagosPanel = main.querySelector('[data-section="pagos"]');
  function activateTabPagos(panel, targetSel) {
    const tabs = panel.querySelectorAll('.tabs .tab');
    const targets = Array.from(tabs).map(t => t.getAttribute('data-target'));
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === targetSel));
    targets.forEach(sel => {
      const el = panel.querySelector(sel);
      if (el) el.hidden = (sel !== targetSel);
    });
  }
  function togglePagoForm(show) { if (pagosPanel) activateTabPagos(pagosPanel, show ? '#formPago' : '#listaPagos'); }
  function setPagoTabPersist(show) { localStorage.setItem('tab_pagos', show ? '#formPago' : '#listaPagos'); }
  if (btnNuevoPago) btnNuevoPago.addEventListener('click', () => { togglePagoForm(true); setPagoTabPersist(true); refreshOrdenOptionsForPagos(); });
  if (cancelPago) cancelPago.addEventListener('click', () => { togglePagoForm(false); setPagoTabPersist(false); });
  async function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (formPago) formPago.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ordenId = pagoOrdenSelect.value;
    const monto = Number(pagoMontoInput.value);
    markField('pagoOrden', !!ordenId, 'Debes seleccionar una orden');
    markField('pagoMonto', monto > 0, 'Monto debe ser mayor que 0');
    if (!ordenId || !(monto > 0)) return;
    let comprobanteArchivo = null;
    try {
      const file = pagoComprobanteFileInput && pagoComprobanteFileInput.files && pagoComprobanteFileInput.files[0];
      if (file) {
        const dataUrl = await fileToDataURL(file);
        comprobanteArchivo = { name: file.name, type: file.type, size: file.size, dataUrl };
      }
    } catch (_) {}
    const pago = {
      id: Date.now(),
      ordenId: Number(ordenId),
      monto,
      comprobante: (pagoComprobanteInput.value || '').trim() || null,
      comprobanteArchivo,
      fecha: Date.now(),
    };
    data.pagos.push(pago);
    // Marcar orden como pagada
    const ordIdx = data.ordenes.findIndex(o => o.id === pago.ordenId);
    if (ordIdx >= 0) data.ordenes[ordIdx].pagada = true;
    // Notificación: pago registrado
    try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Pago de orden #${pago.ordenId} por $${Number(monto).toFixed(2)}`, fecha: Date.now() }); } catch {}
    Store.save(data);
    togglePagoForm(false);
    formPago.reset();
    renderPagos(); updateKPIsAndChart(); updateCharts(); try { renderNotificaciones(); } catch {}
    // Sincronizar backend
    try {
      if (window.Api && window.Api.isEnabled()) {
        // Mapear a modelo del backend
        const order = data.ordenes.find(o => o.id === pago.ordenId);
        const orderNumber = (order && (order.number || order.id)) ? String(order.number || order.id) : String(pago.ordenId);
        await window.Api.post('/api/payments', { orderNumber, amount: pago.monto, date: new Date(pago.fecha).toISOString().slice(0,10) });
        if (ordIdx >= 0) await window.Api.patch(`/api/orders/${encodeURIComponent(pago.ordenId)}`, { paid: true });
      }
    } catch (_) {}
  });

  function setupPanelTabsPagos() {
    if (!pagosPanel) return;
    const tabs = pagosPanel.querySelectorAll('.tabs .tab');
    const tabKey = 'tab_pagos';
    tabs.forEach(tab => tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSel = tab.getAttribute('data-target');
      activateTabPagos(pagosPanel, targetSel);
      localStorage.setItem(tabKey, targetSel);
      if (targetSel === '#formPago') refreshOrdenOptionsForPagos();
    }));
    const initialSaved = localStorage.getItem(tabKey);
    const targets = Array.from(tabs).map(t => t.getAttribute('data-target'));
    const initialTarget = initialSaved && targets.includes(initialSaved)
      ? initialSaved
      : (pagosPanel.querySelector('.tabs .tab.active') || tabs[0])?.getAttribute('data-target');
    if (initialTarget) activateTabPagos(pagosPanel, initialTarget);
    if (initialTarget === '#formPago') refreshOrdenOptionsForPagos();
  }
  // ---------- Órdenes ----------
  const listaOrdenes = document.getElementById('listaOrdenes');
  const formOrden = document.getElementById('formOrden');
  const btnNuevaOrden = document.getElementById('btnNuevaOrden');
  const ordenFilters = document.getElementById('ordenFilters');
  const toggleOrdenFiltersBtn = document.getElementById('toggleOrdenFilters');
  const provFilters = document.getElementById('provFilters');
  const toggleProvFiltersBtn = document.getElementById('toggleProvFilters');
  const reporteFilters = document.getElementById('reporteFilters');
  const toggleReportFiltersBtn = document.getElementById('toggleReportFilters');
  const cancelOrden = document.getElementById('cancelOrden');
  const ordPacienteInput = document.getElementById('ordPaciente');
  const ordProveedorSelect = document.getElementById('ordProveedor');
  // Nuevos campos para la orden (estructura solicitada)
  const ordConsecutivoInput = document.getElementById('ordConsecutivo');
  const ordNumeroInput = document.getElementById('ordNumero');
  const ordFechaInput = document.getElementById('ordFecha');
  const ordCiudadInput = document.getElementById('ordCiudad');
  const ordHeadquarterInput = document.getElementById('ordHeadquarter');
  const ordEmpresaInput = document.getElementById('ordEmpresa');
  const ordPacienteCCInput = document.getElementById('ordPacienteCC');
  const ordClaseLentesSelect = document.getElementById('ordClaseLentes');
  const ordTipoLenteFiltrosInput = document.getElementById('ordTipoLenteFiltros');
  const ordODInput = document.getElementById('ordOD');
  const ordOIInput = document.getElementById('ordOI');
  const ordADDInput = document.getElementById('ordADD');
  const ordDPALTInput = document.getElementById('ordDPALT');
  const ordInfoAdicionalInput = document.getElementById('ordInfoAdicional');
  const ordTipoMonturaInput = document.getElementById('ordTipoMontura');
  const ordObservacionesInput = document.getElementById('ordObservaciones');
  const ordFechaEntregaInput = document.getElementById('ordFechaEntrega');
  const ordEstadoSelect = document.getElementById('ordEstado');

  function providerNameById(id) {
    const p = data.proveedores.find(x => String(x.id) === String(id));
    return p ? (p.name || p.nombre || p.nit || `(id ${id})`) : '(sin proveedor)';
  }

  // Helpers para compatibilidad de órdenes con distintos esquemas
  function getOrderProviderId(o) { return (o.idProvider ?? o.proveedorId ?? o.providerId ?? o.proveedor_id); }
  function getOrderPatientDisplay(o) { return (o.patientName ?? o.paciente ?? o.documentPatient ?? o.pacienteCC ?? ''); }
  function getOrderPatientDocument(o) { return (o.documentPatient ?? o.pacienteCC ?? ''); }
  function getOrderState(o) { return (o.state ?? o.estado ?? 'CREATED'); }
  function getOrderPaid(o) { return (typeof o.paid !== 'undefined' ? !!o.paid : !!o.pagada); }
  function getOrderDateTs(o) {
    const d = o.shippingDate || o.fecha;
    if (typeof d === 'string') {
      const t = Date.parse(d);
      if (!Number.isNaN(t)) return t;
    }
    return (o.createdAt || o.id || Date.now());
  }

  // Datos adicionales para mostrar en el listado
  function getOrderHeadquarterId(o) { return (o.idHeadquarter ?? o.headquarter ?? o.sedeId ?? null); }
  function sedeNameById(id) {
    const s = Array.isArray(data.sedes) ? data.sedes.find(s => String(s.id) === String(id)) : null;
    return s ? (s.name || s.nombre || `Sede ${s.id}`) : (id ? `Sede ${id}` : '-');
  }
  function getAssistantAssignedHeadquarterId() {
    try {
      let saved = localStorage.getItem('assistant_headquarter_id');
      if (saved) return saved;
      const authUser = localStorage.getItem('auth_username') || sessionStorage.getItem('auth_username') || '';
      if (authUser && Array.isArray(data.usuarios)) {
        const u = data.usuarios.find(x => (x.email === authUser) || (x.name === authUser));
        if (u && u.headquarterId) {
          saved = String(u.headquarterId);
          localStorage.setItem('assistant_headquarter_id', saved);
          return saved;
        }
      }
    } catch {}
    return null;
  }
  function getOrderConsecutivo(o) { return (o.consecutivo ?? o.sequence ?? ''); }
  function getOrderLabNumber(o) { return (o.number ?? o.labOrder ?? o.id ?? ''); }
  function getOrderPaymentReceipt(o) {
    try {
      const labNum = getOrderLabNumber(o);
      const candidates = (Array.isArray(data.pagos) ? data.pagos : []).filter(p =>
        String(p.ordenId) === String(o.id) || String(p.orderNumber) === String(labNum) || String(p.ordenId) === String(labNum)
      );
      if (candidates.length === 0) return '';
      const last = candidates.reduce((a, b) => ((a.fecha || 0) > (b.fecha || 0) ? a : b));
      return last.comprobante || '';
    } catch { return ''; }
  }
  function fechaCortaTs(ts) { const d = new Date(ts); return isNaN(d.getTime()) ? '-' : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }

  // Modal genérico para filtros
  const filtersModalState = {};
  function openFiltersModal(containerEl, title, triggerBtn) {
    if (!containerEl) return;
    const id = containerEl.id || Math.random().toString(36).slice(2);
    // Guardar parent y nextSibling para restaurar
    filtersModalState[id] = { parent: containerEl.parentElement, next: containerEl.nextElementSibling };
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.zIndex = '1000';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed'; modal.style.top = '50%'; modal.style.left = '50%'; modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(700px, 94vw)'; modal.style.maxHeight = '85vh'; modal.style.overflow = 'auto'; modal.style.padding = '16px';
    const header = document.createElement('div');
    header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center'; header.style.gap = '8px';
    header.innerHTML = `<div><h3 style="margin:0;">${title || 'Filtros'}</h3><div style="color:var(--c-text-light);font-size:13px;">Ajusta los criterios y aplica</div></div><button class="btn-outline" id="closeFiltersModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>`;
    const body = document.createElement('div');
    containerEl.hidden = false;
    body.appendChild(containerEl);
    const footer = document.createElement('div');
    footer.style.display = 'flex'; footer.style.gap = '8px'; footer.style.marginTop = '12px';
    const applyBtn = document.createElement('button'); applyBtn.className = 'btn-primary'; applyBtn.textContent = 'Aplicar';
    const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn-outline'; cancelBtn.textContent = 'Cerrar';
    footer.appendChild(applyBtn); footer.appendChild(cancelBtn);
    modal.appendChild(header); modal.appendChild(body); modal.appendChild(footer);
    overlay.appendChild(modal); document.body.appendChild(overlay);

    function close() {
      try {
        const st = filtersModalState[id];
        if (st && st.parent) {
          containerEl.hidden = true;
          if (st.next && st.next.parentElement === st.parent) st.parent.insertBefore(containerEl, st.next);
          else st.parent.appendChild(containerEl);
        }
        document.body.removeChild(overlay);
        if (triggerBtn) triggerBtn.setAttribute('aria-pressed', 'false');
      } catch {}
    }
    if (triggerBtn) triggerBtn.setAttribute('aria-pressed', 'true');
    modal.querySelector('#closeFiltersModal').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    applyBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
  }

  // Hook de botones de lupa
  if (toggleOrdenFiltersBtn) toggleOrdenFiltersBtn.addEventListener('click', () => openFiltersModal(ordenFilters, 'Filtros de órdenes', toggleOrdenFiltersBtn));
  if (toggleProvFiltersBtn) toggleProvFiltersBtn.addEventListener('click', () => openFiltersModal(provFilters, 'Filtros de proveedores', toggleProvFiltersBtn));
  if (toggleReportFiltersBtn) toggleReportFiltersBtn.addEventListener('click', () => openFiltersModal(reporteFilters, 'Filtros de reportes', toggleReportFiltersBtn));
  // Nuevos filtros: Sedes y Usuarios
  const sedeFilters = document.getElementById('sedeFilters');
  const toggleSedeFiltersBtn = document.getElementById('toggleSedeFilters');
  if (toggleSedeFiltersBtn) toggleSedeFiltersBtn.addEventListener('click', () => openFiltersModal(sedeFilters, 'Filtros de sedes', toggleSedeFiltersBtn));
  const usuarioFilters = document.getElementById('usuarioFilters');
  const toggleUsuarioFiltersBtn = document.getElementById('toggleUsuarioFilters');
  if (toggleUsuarioFiltersBtn) toggleUsuarioFiltersBtn.addEventListener('click', () => openFiltersModal(usuarioFilters, 'Filtros de usuarios', toggleUsuarioFiltersBtn));

  function refreshProveedorOptions() {
    if (!ordProveedorSelect) return;
    const current = ordProveedorSelect.value;
    ordProveedorSelect.innerHTML = '<option value="">Selecciona proveedor...</option>';
    (Array.isArray(data.proveedores) ? data.proveedores : []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = (p.name || p.nombre || `Proveedor ${p.id}`);
      ordProveedorSelect.appendChild(opt);
    });
    if (Array.from(ordProveedorSelect.options).some(o => o.value === current)) ordProveedorSelect.value = current;
  }

  function refreshHeadquarterOptionsOrden() {
    if (!ordHeadquarterInput) return;
    const role = getRole();
    const current = ordHeadquarterInput.value;
    const sedesArr = Array.isArray(data.sedes) ? data.sedes : [];
    ordHeadquarterInput.innerHTML = '';
    if (role === 'assistant') {
      const assigned = getAssistantAssignedHeadquarterId();
      if (assigned) {
        const s = sedesArr.find(x => String(x.id) === String(assigned));
        const opt = document.createElement('option');
        opt.value = String(assigned);
        opt.textContent = s ? (s.name || s.nombre || `Sede ${s.id}`) : `Sede ${assigned}`;
        ordHeadquarterInput.appendChild(opt);
        ordHeadquarterInput.value = String(assigned);
        try { ordHeadquarterInput.disabled = true; } catch {}
        return;
      }
    }
    ordHeadquarterInput.innerHTML = '<option value="">Sin sede</option>';
    sedesArr.forEach(s => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      opt.textContent = (s.name || s.nombre || `Sede ${s.id}`);
      ordHeadquarterInput.appendChild(opt);
    });
    if (Array.from(ordHeadquarterInput.options).some(o => o.value === current)) ordHeadquarterInput.value = current;
    try { ordHeadquarterInput.disabled = false; } catch {}
  }

  // ---------- Sedes ----------
  const listaSedes = document.getElementById('listaSedes');
  function renderSedes() {
    if (!listaSedes) return;
    const nombre = document.getElementById('filtroSedeNombre')?.value.trim().toLowerCase() || '';
    let sedes = Array.isArray(data.sedes) ? data.sedes : [];
    sedes = sedes.filter(s => {
      const nm = (s.name || s.nombre || '').toLowerCase();
      if (nombre && !nm.includes(nombre)) return false;
      return true;
    });

    listaSedes.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.innerHTML = '<div>ID</div><div>Nombre</div><div>Ciudad</div><div>Dirección</div><div>Acciones</div>';
    listaSedes.appendChild(head);
    if (sedes.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay sedes con esos filtros.';
      listaSedes.appendChild(empty);
    } else {
      sedes.forEach((s) => {
        const row = document.createElement('div'); row.className = 'table-row';
        const accionesHtml = `<div class="acciones">
          <button class="btn-outline btn-sm" data-action="edit" title="Editar"><iconify-icon icon="ph:pencil"></iconify-icon><span class="label">Editar</span></button>
          <button class="btn-outline btn-sm" data-action="delete" title="Eliminar"><iconify-icon icon="ph:trash"></iconify-icon><span class="label">Eliminar</span></button>
        </div>`;
        row.innerHTML = `<div>${s.id ?? ''}</div><div>${s.name || s.nombre || '-'}</div><div>${s.city || s.ciudad || '-'}</div><div>${s.address || s.direccion || '-'}</div>${accionesHtml}`;
        const editBtn = row.querySelector('button[data-action="edit"]');
        const delBtn = row.querySelector('button[data-action="delete"]');
        editBtn.addEventListener('click', async () => {
          // Modal mínimo para edición parcial (PATCH)
          const overlay = document.createElement('div'); overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,0.35)'; overlay.style.zIndex='1000';
          const modal = document.createElement('div'); modal.className='card'; modal.style.position='fixed'; modal.style.top='50%'; modal.style.left='50%'; modal.style.transform='translate(-50%, -50%)'; modal.style.width='min(600px, 94vw)'; modal.style.padding='16px';
          modal.innerHTML = `<h3 style="margin-top:0;">Editar sede #${s.id}</h3>
            <div class="form">
              <div class="field"><label>Nombre</label><input id="sedeEditName" value="${(s.name || s.nombre || '')}" /></div>
              <div class="field"><label>Ciudad</label><input id="sedeEditCity" value="${(s.city || s.ciudad || '')}" /></div>
              <div class="field"><label>Dirección</label><input id="sedeEditAddress" value="${(s.address || s.direccion || '')}" /></div>
              <div style="display:flex;gap:8px;margin-top:8px;">
                <button class="btn-primary" id="sedeEditSave">Guardar</button>
                <button class="btn-outline" id="sedeEditCancel">Cancelar</button>
              </div>
            </div>`;
          overlay.appendChild(modal); document.body.appendChild(overlay);
          function close() { try { document.body.removeChild(overlay); } catch {} }
          modal.querySelector('#sedeEditCancel').addEventListener('click', (e) => { e.preventDefault(); close(); });
          modal.querySelector('#sedeEditSave').addEventListener('click', async (e) => {
            e.preventDefault();
            const name = modal.querySelector('#sedeEditName').value.trim();
            const city = modal.querySelector('#sedeEditCity').value.trim();
            const address = modal.querySelector('#sedeEditAddress').value.trim();
            const payload = {};
            if (name) payload.name = name;
            if (city) payload.city = city;
            if (address) payload.address = address;
            try { await window.Api.patch(`/api/headquarters/${encodeURIComponent(s.id)}`, payload); } catch {}
            try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
            renderSedes(); close();
          });
        });
        delBtn.addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta sede?')) return;
          try { await window.Api.del(`/api/headquarters/${encodeURIComponent(s.id)}`); } catch {}
          try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
          renderSedes();
        });
        listaSedes.appendChild(row);
      });
    }
  }
  // Filtros sedes
  ['filtroSedeNombre'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', renderSedes); });
  const limpiarSede = document.getElementById('limpiarFiltrosSede');
  if (limpiarSede) limpiarSede.addEventListener('click', () => { const el = document.getElementById('filtroSedeNombre'); if (el) el.value = ''; renderSedes(); });

  // ---------- Usuarios ----------
  const listaUsuarios = document.getElementById('listaUsuarios');
  const formUsuario = document.getElementById('formUsuario');
  
  // Renderizar tabla de usuarios con columnas: Nombre, Email, NIT, Rol, Acciones
  function renderUsuarios() {
    if (!listaUsuarios) return;
    const nombre = document.getElementById('filtroUsuarioNombre')?.value.trim().toLowerCase() || '';
    const emailFiltro = document.getElementById('filtroUsuarioEmail')?.value.trim().toLowerCase() || '';
    
    let usuarios = Array.isArray(data.usuarios) ? data.usuarios : [];
    usuarios = usuarios.filter(u => {
      const nm = (u.name || '').toLowerCase();
      const em = (u.email || '').toLowerCase();
      if (nombre && !nm.includes(nombre)) return false;
      if (emailFiltro && !em.includes(emailFiltro)) return false;
      return true;
    });

    listaUsuarios.innerHTML = '';
    // Grid template para tabla de usuarios
    const gridTemplate = '1fr 1.5fr 1fr 1fr 1fr 140px';
    const head = document.createElement('div');
    head.className = 'table-row table-head';
    head.style.gridTemplateColumns = gridTemplate;
    head.innerHTML = '<div>Nombre</div><div>Email</div><div>NIT</div><div>Rol</div><div>Sede</div><div>Acciones</div>';
    listaUsuarios.appendChild(head);

    if (usuarios.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay usuarios.';
      listaUsuarios.appendChild(empty);
    } else {
      usuarios.forEach((u) => {
        const row = document.createElement('div'); row.className = 'table-row';
        row.style.gridTemplateColumns = gridTemplate;
        const roleName = (data.roles || []).find(r => Number(r.id) === Number(u.idRole))?.name || (u.idRole === 1 ? 'Admin' : 'Asistente');
        
        const accionesHtml = `<div class="acciones">
          <button class="btn-outline btn-sm" data-action="edit" title="Editar"><iconify-icon icon="ph:pencil"></iconify-icon> <span class="label">Editar</span></button>
          <button class="btn-outline btn-sm" data-action="delete" title="Eliminar"><iconify-icon icon="ph:trash"></iconify-icon> <span class="label">Eliminar</span></button>
        </div>`;
        
        row.innerHTML = `<div>${u.name}</div><div>${u.email}</div><div>${u.nit || '-'}</div><div>${roleName}</div><div>${sedeNameById(u.headquarterId) || '-'}</div>${accionesHtml}`;
        
        // Editar Usuario
        row.querySelector('button[data-action="edit"]').addEventListener('click', () => {
             // Llenar formulario y mostrar
             if(usuNameInput) usuNameInput.value = u.name || '';
             if(usuNitInput) usuNitInput.value = u.nit || '';
             if(usuEmailInput) usuEmailInput.value = u.email || '';
             if(usuRoleSelect) usuRoleSelect.value = u.idRole || '';
             refreshHeadquarterOptionsUsuarios();
             if(usuHeadquarterSelect) usuHeadquarterSelect.value = u.headquarterId || '';
             // Password opcional en edición (no llenar)
             if(usuPasswordInput) usuPasswordInput.value = '';
             
             // Guardar ID en dataset del form para saber que es edición
             if(formUsuarioRef) formUsuarioRef.dataset.editId = u.id;
             toggleUsuarioForm(true);
             refreshRoleOptions();
        });

        // Eliminar Usuario
        row.querySelector('button[data-action="delete"]').addEventListener('click', async () => {
          if (!confirm(`¿Eliminar usuario ${u.name}?`)) return;
          try { await window.Api.del(`/api/users/${encodeURIComponent(u.id)}`); } catch {}
          try { 
              const idx = data.usuarios.findIndex(x => x.id === u.id);
              if(idx > -1) data.usuarios.splice(idx, 1);
              Store.save(data);
          } catch {}
          renderUsuarios();
        });

        listaUsuarios.appendChild(row);
      });
    }
  }

  // Actualizar listener de submit para soportar edición
  if (formUsuario) {
      // Remover listener anterior (hacky way: clone node)
      // Mejor: redefinimos el handler
      const newForm = formUsuario.cloneNode(true);
      formUsuario.parentNode.replaceChild(newForm, formUsuario);
      // Re-asignar variables
      const formUsuarioRef = document.getElementById('formUsuario');
      const usuNitInputRef = document.getElementById('usuNit');
      const usuNameInputRef = document.getElementById('usuName');
      const usuEmailInputRef = document.getElementById('usuEmail');
      const usuPasswordInputRef = document.getElementById('usuPassword');
      const usuRoleSelectRef = document.getElementById('usuRole');
      const usuHeadquarterSelectRef = document.getElementById('usuHeadquarter');

      formUsuarioRef.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = formUsuarioRef.dataset.editId; // Si existe, es edición
        
        const nit = usuNitInputRef?.value.trim();
        const name = usuNameInputRef?.value.trim();
        const email = usuEmailInputRef?.value.trim();
        const password = usuPasswordInputRef?.value.trim();
        const idRole = Number(usuRoleSelectRef?.value || 0);
        const headquarterId = (usuHeadquarterSelectRef?.value ? Number(usuHeadquarterSelectRef.value) : null);

        if (!name || !email || !idRole) { alert('Faltan datos obligatorios'); return; }
        
        const payload = { nit, name, email, idRole };
        if (headquarterId) payload.headquarterId = headquarterId;
        if (password) payload.password = password;

        try {
            if (editId) {
                // Modo Edición
                await window.Api.patch(`/api/users/${encodeURIComponent(editId)}`, payload);
                // Actualizar local
                const local = data.usuarios.find(u => u.id == editId);
                if(local) Object.assign(local, payload);
            } else {
                // Modo Creación
                if (!password) { alert('Contraseña obligatoria para nuevos usuarios'); return; }
                payload.password = password;
                await window.Api.post('/api/users', payload);
                // Actualizar local (mock)
                const nextId = (Math.max(0, ...((data.usuarios || []).map(u => Number(u.id) || 0))) || 0) + 1;
                data.usuarios.push({ id: nextId, ...payload });
            }
            Store.save(data);
            try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
            formUsuarioRef.reset();
            delete formUsuarioRef.dataset.editId;
            toggleUsuarioForm(false);
            renderUsuarios();
        } catch (err) {
            console.error(err);
            alert('Error al guardar usuario');
        }
      });
  }

  // Filtros de usuarios
  ['filtroUsuarioNombre','filtroUsuarioEmail'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', renderUsuarios); });
  const limpiarUsuario = document.getElementById('limpiarFiltrosUsuario');
  const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
  const cancelUsuario = document.getElementById('cancelUsuario');
  const usuNitInput = document.getElementById('usuNit');
  const usuNameInput = document.getElementById('usuName');
  const usuEmailInput = document.getElementById('usuEmail');
  const usuPasswordInput = document.getElementById('usuPassword');
  const usuRoleSelect = document.getElementById('usuRole');
  const usuHeadquarterSelect = document.getElementById('usuHeadquarter');

  // Tabs usuarios
  const usuariosPanel = main.querySelector('[data-section="usuarios"]');
  function toggleUsuarioForm(show) { 
      if (usuariosPanel) { 
          const tabs = usuariosPanel.querySelectorAll('.tabs .tab'); 
          const targetSel = show ? '#formUsuario' : '#listaUsuarios'; 
          tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === targetSel)); 
          ['#formUsuario','#listaUsuarios'].forEach(sel => { 
              const el = usuariosPanel.querySelector(sel); 
              if (el) el.hidden = (sel !== targetSel); 
          }); 
      } 
  }
  
  if (btnNuevoUsuario) btnNuevoUsuario.addEventListener('click', () => { 
      const f = document.getElementById('formUsuario');
      if(f) { f.reset(); delete f.dataset.editId; }
      toggleUsuarioForm(true); 
      refreshRoleOptions(); 
      refreshHeadquarterOptionsUsuarios();
  });
  if (cancelUsuario) cancelUsuario.addEventListener('click', () => { toggleUsuarioForm(false); });
  if (limpiarUsuario) limpiarUsuario.addEventListener('click', () => {
    ['filtroUsuarioNombre','filtroUsuarioEmail'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderUsuarios();
  });

  async function refreshRoleOptions() {
    if (!usuRoleSelect) return;
    // Si no hay roles cargados, intenta cargarlos
    if (!Array.isArray(data.roles) || data.roles.length === 0) {
      try { const roles = await window.Api.get('/api/roles'); data.roles = Array.isArray(roles) ? roles : []; } catch {}
    }
    const current = usuRoleSelect.value;
    usuRoleSelect.innerHTML = '';
    data.roles.forEach(r => { const opt = document.createElement('option'); opt.value = String(r.id); opt.textContent = r.name || r.nombre || `Rol ${r.id}`; usuRoleSelect.appendChild(opt); });
    if (Array.from(usuRoleSelect.options).some(o => o.value === current)) usuRoleSelect.value = current;
  }

  function refreshHeadquarterOptionsUsuarios() {
    if (!usuHeadquarterSelect) return;
    const current = usuHeadquarterSelect.value;
    usuHeadquarterSelect.innerHTML = '<option value="">Sin sede</option>';
    (Array.isArray(data.sedes) ? data.sedes : []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      opt.textContent = s.name || s.nombre || `Sede ${s.id}`;
      usuHeadquarterSelect.appendChild(opt);
    });
    if (Array.from(usuHeadquarterSelect.options).some(o => o.value === current)) usuHeadquarterSelect.value = current;
  }


  function openOrdenDetails(o) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.zIndex = '1000';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed'; modal.style.top = '50%'; modal.style.left = '50%'; modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(700px, 92vw)'; modal.style.maxHeight = '85vh'; modal.style.overflow = 'auto'; modal.style.padding = '16px';
    const monto = (data.pagos || []).filter(p => Number(p.ordenId) === Number(o.id)).reduce((s, p) => s + Number(p.monto || 0), 0);
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <h3 style="margin:0;">Detalles de la orden</h3>
          <div style="color:var(--c-text-light);font-size:13px;">Información completa</div>
        </div>
        <button class="btn-outline" id="closeOrdenModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div><div style="color:var(--c-text-light);font-size:13px;">Número de orden</div><div>#${o.id}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Cliente</div><div>${getOrderPatientDisplay(o)}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(getOrderProviderId(o))}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Monto</div><div>$${monto.toFixed(2)}</div></div>
      </div>
      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Fórmula óptica</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Ojo derecho (OD)</div>
            <div style="color:var(--c-text-light);">${o.formulaOD || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Ojo izquierdo (OI)</div>
            <div style="color:var(--c-text-light);">${o.formulaOI || '-'}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <div style="color:var(--c-text-light);font-size:13px;">Descripción</div>
        <div>${o.notas || 'Sin descripción'}</div>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const closeBtn = modal.querySelector('#closeOrdenModal');
    function close() { try { document.body.removeChild(overlay); } catch {} }
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  function openOrdenDetails(o) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.zIndex = '1000';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed'; modal.style.top = '50%'; modal.style.left = '50%'; modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(700px, 92vw)'; modal.style.maxHeight = '85vh'; modal.style.overflow = 'auto'; modal.style.padding = '16px';
    const monto = (data.pagos || []).filter(p => Number(p.ordenId) === Number(o.id)).reduce((s, p) => s + Number(p.monto || 0), 0);
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <h3 style="margin:0;">Detalles de la orden</h3>
          <div style="color:var(--c-text-light);font-size:13px;">Información completa</div>
        </div>
        <button class="btn-outline" id="closeOrdenModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div><div style="color:var(--c-text-light);font-size:13px;">Número de orden</div><div>#${o.id}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Cliente</div><div>${getOrderPatientDisplay(o)}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(getOrderProviderId(o))}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Monto</div><div>${monto.toFixed(2)}</div></div>
      </div>
      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Fórmula óptica</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Ojo derecho (OD)</div>
            <div style="color:var(--c-text-light);">${o.formulaOD || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Ojo izquierdo (OI)</div>
            <div style="color:var(--c-text-light);">${o.formulaOI || '-'}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <div style="color:var(--c-text-light);font-size:13px;">Descripción</div>
        <div>${o.notas || 'Sin descripción'}</div>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const closeBtn = modal.querySelector('#closeOrdenModal');
    function close() { try { document.body.removeChild(overlay); } catch {} }
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  function openOrdenDetails(o) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.35)';
    overlay.style.zIndex = '1000';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(700px, 92vw)';
    modal.style.maxHeight = '85vh';
    modal.style.overflow = 'auto';
    modal.style.padding = '16px';
    const monto = (data.pagos || []).filter(p => Number(p.ordenId) === Number(o.id)).reduce((s, p) => s + Number(p.monto || 0), 0);
    const fechaStr = getOrderDateTs(o) ? new Date(getOrderDateTs(o)).toLocaleDateString() : '-';
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <h3 style="margin:0;">Detalles de la orden</h3>
          <div style="color:var(--c-text-light);font-size:13px;">Información completa de la orden de trabajo</div>
        </div>
        <button class="btn-outline" id="closeOrdenModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div><div style="color:var(--c-text-light);font-size:13px;">ID (sistema)</div><div>#${o.number || o.id}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Consecutivo sistema</div><div>${o.consecutivo || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Orden #</div><div>${o.number || o.numero || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Fecha envío</div><div>${fechaStr}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Ciudad/Municipio</div><div>${o.ciudad || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Sede</div><div>${o.sede || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Empresa/Convenio</div><div>${o.empresa || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(getOrderProviderId(o))}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Paciente</div><div>${getOrderPatientDisplay(o)}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Doc. paciente</div><div>${getOrderPatientDocument(o) || '-'}</div></div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Lentes</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Clase de lentes</div>
            <div style="color:var(--c-text-light);">${o.claseLentes || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Tipo de lente y filtros</div>
            <div style="color:var(--c-text-light);">${o.tipoLenteFiltros || '-'}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Valores ópticos</h4>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">OD</div><div style="color:var(--c-text-light);">${o.od || '-'}</div></div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">OI</div><div style="color:var(--c-text-light);">${o.oi || '-'}</div></div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">ADD</div><div style="color:var(--c-text-light);">${o.add || '-'}</div></div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">DP y ALT</div><div style="color:var(--c-text-light);">${o.dpAlt || '-'}</div></div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Recepción</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Estado</div>
            <div style="color:var(--c-text-light);">${stateBadgeHtml(getOrderState(o))}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Recibido por</div>
            <div style="color:var(--c-text-light);">${o.receivedBy || '-'}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Fechas</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Creación</div>
            <div style="color:var(--c-text-light);">${o.createdAt ? fechaCortaTs(o.createdAt) : '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Cambio estado actual</div>
            <div style="color:var(--c-text-light);">${(o.stateTimestamps && o.stateTimestamps[String(getOrderState(o)).toUpperCase()]) ? fechaCortaTs(o.stateTimestamps[String(getOrderState(o)).toUpperCase()]) : '-'}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Otros</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Tipo de montura</div>
            <div style="color:var(--c-text-light);">${o.tipoMontura || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Información adicional</div>
            <div style="color:var(--c-text-light);">${o.infoAdicional || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Tiempo de control</div>
            <div style="color:var(--c-text-light);">${o.tiempoControl || '-'}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <div style="color:var(--c-text-light);font-size:13px;">Observaciones</div>
        <div>${o.observaciones || '-'}</div>
        <div style="color:var(--c-text-light);font-size:13px;margin-top:8px;">Monto pagado</div>
        <div>${monto.toFixed(2)}</div>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const closeBtn = modal.querySelector('#closeOrdenModal');
    function close() { try { document.body.removeChild(overlay); } catch {} }
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  function openOrdenDetails(o) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.35)';
    overlay.style.zIndex = '1000';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(700px, 92vw)';
    modal.style.maxHeight = '85vh';
    modal.style.overflow = 'auto';
    modal.style.padding = '16px';
    const monto = (data.pagos || []).filter(p => Number(p.ordenId) === Number(o.id)).reduce((s, p) => s + Number(p.monto || 0), 0);
    const fechaStr = o.fecha ? new Date(o.fecha).toLocaleDateString() : '-';
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <h3 style="margin:0;">Detalles de la orden</h3>
          <div style="color:var(--c-text-light);font-size:13px;">Información completa de la orden de trabajo</div>
        </div>
        <button class="btn-outline" id="closeOrdenModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div><div style="color:var(--c-text-light);font-size:13px;">ID (sistema)</div><div>#${o.id}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Consecutivo sistema</div><div>${o.consecutivo || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Orden #</div><div>${o.numero || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Fecha</div><div>${fechaStr}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Ciudad/Municipio</div><div>${o.ciudad || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Sede</div><div>${o.sede || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Empresa/Convenio</div><div>${o.empresa || '-'}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(getOrderProviderId(o))}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Paciente</div><div>${getOrderPatientDisplay(o)}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Doc. paciente</div><div>${getOrderPatientDocument(o) || '-'}</div></div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Lentes</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Clase de lentes</div>
            <div style="color:var(--c-text-light);">${o.claseLentes || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Tipo de lente y filtros</div>
            <div style="color:var(--c-text-light);">${o.tipoLenteFiltros || '-'}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Valores ópticos</h4>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">OD</div><div style="color:var(--c-text-light);">${o.od || '-'}</div></div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">OI</div><div style="color:var(--c-text-light);">${o.oi || '-'}</div></div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">ADD</div><div style="color:var(--c-text-light);">${o.add || '-'}</div></div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;"><div style="font-weight:600;">DP y ALT</div><div style="color:var(--c-text-light);">${o.dpAlt || '-'}</div></div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <h4 style="margin:8px 0;">Otros</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Tipo de montura</div>
            <div style="color:var(--c-text-light);">${o.tipoMontura || '-'}</div>
          </div>
          <div style="border:1px solid var(--c-border);border-radius:8px;padding:12px;">
            <div style="font-weight:600;">Información adicional</div>
            <div style="color:var(--c-text-light);">${o.infoAdicional || '-'}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <div style="color:var(--c-text-light);font-size:13px;">Observaciones</div>
        <div>${o.observaciones || '-'}</div>
        <div style="color:var(--c-text-light);font-size:13px;margin-top:8px;">Monto pagado</div>
        <div>$${monto.toFixed(2)}</div>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const closeBtn = modal.querySelector('#closeOrdenModal');
    function close() { try { document.body.removeChild(overlay); } catch {} }
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  // [Bloque renderOrdenes antiguo eliminado]

  // Función reutilizable para renderizar tablas de órdenes
  function renderOrderTable(container, orders) {
    if (!container) return;
    container.innerHTML = '';

    const role = getRole();
    const isAssistant = role === 'assistant';
    const isProvider = role === 'provider';

    // Definición de columnas
    const cols = [
      { header: 'Consecutivo', width: '90px', show: true },
      { header: 'Fecha', width: '100px', show: true },
      { header: 'Paciente', width: 'minmax(200px, 2fr)', show: true },
      { header: 'Fac. Dr Mejia', width: '120px', show: true },
      { header: 'Orden Lab', width: '100px', show: true },
      { header: 'Fac. Venta Lab', width: '120px', show: true },
      { header: 'Proveedor', width: '140px', show: true },
      { header: 'Sede', width: '110px', show: true },
      { header: 'Tipo Lente (Asesor)', width: '150px', show: !isProvider },
      { header: 'Tipo Lente (Admon)', width: '150px', show: (role === 'admin') },
      { header: 'Fórmula', width: '140px', show: true },
      { header: 'Estado', width: '120px', show: true },
      { header: 'Fecha estado', width: '120px', show: (role === 'admin') },
      { header: 'Precio Venta', width: '120px', show: !isProvider },
      { header: 'Precio Costo', width: '120px', show: (role === 'admin') },
      { header: 'Utilidad', width: '120px', show: (!isAssistant && !isProvider) },
      { header: 'Acciones', width: '140px', show: true }
    ];

    const visibleCols = cols.filter(c => c.show);
    const gridTemplate = visibleCols.map(c => c.width).join(' ');

    // Header
    const head = document.createElement('div');
    head.className = 'table-row table-head';
    head.style.gridTemplateColumns = gridTemplate;
    head.innerHTML = visibleCols.map(c => `<div>${c.header}</div>`).join('');
    container.appendChild(head);

    if (orders.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay órdenes para mostrar.';
      container.appendChild(empty);
      return;
    }

    const fmtMoney = (val) => '$ ' + new Intl.NumberFormat('es-CO').format(val || 0);

    orders.forEach((o, idx) => {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.style.gridTemplateColumns = gridTemplate;

      const isPaid = getOrderPaid(o);
      const currState = String(getOrderState(o) || '').toUpperCase();
      const canMarkReturn = isProvider && !['RETURN_ROUTE','RECEIVED','COMPLETED','CANCELLED'].includes(currState);
      const stateSelectHtml = (role === 'admin') ? `
        <select class="btn-outline btn-sm" style="min-width:140px" onchange="window.adminSetOrderState(${o.id}, this.value)">
          <option value="${currState}">Estado: ${stateInfo(currState).label}</option>
          ${['CREATED','SENT','IN_PROGRESS','RETURN_ROUTE','RECEIVED','COMPLETED','CANCELLED'].filter(s=>s!==currState).map(s=>`<option value="${s}">${stateInfo(s).label}</option>`).join('')}
        </select>
      ` : '';
      const accionesHtml = `<div class="acciones">
        <button class="btn-outline btn-sm" onclick="window.openOrdenDetailsById(${o.id})" title="Ver detalles">
          <iconify-icon icon="ph:eye"></iconify-icon> <span class="label">Ver</span>
        </button>
        ${role==='admin' ? `<button class="btn-outline btn-sm" onclick="window.editOrderById(${o.id})" title="Editar">
          <iconify-icon icon="ph:pencil"></iconify-icon> <span class="label">Editar</span>
        </button>` : ''}
        ${stateSelectHtml}
        ${canMarkReturn ? `<button class="btn-outline btn-sm" onclick="window.markReturnRouteById(${o.id})" title="Marcar retorno">
          <iconify-icon icon="ph:arrow-u-down-left"></iconify-icon> <span class="label">Retorno</span>
        </button>` : ''}
        <button class="btn-outline btn-sm" onclick="window.payOrderById(${o.id})" title="${isPaid ? 'Pagada' : 'Marcar pagada'}" ${isPaid ? 'disabled' : ''}>
          <iconify-icon icon="ph:check-circle"></iconify-icon> <span class="label">${isPaid ? 'Pagada' : 'Pagar'}</span>
        </button>
        <button class="btn-outline btn-sm" onclick="window.deleteOrderById(${o.id})" title="Eliminar">
          <iconify-icon icon="ph:trash"></iconify-icon> <span class="label">Eliminar</span>
        </button>
      </div>`;

      const nombreCedula = `${getOrderPatientDisplay(o)}${getOrderPatientDocument(o) ? ' - ' + getOrderPatientDocument(o) : ''}`;
      const utilidad = (Number(o.precioVenta || 0) - Number(o.precioCosto || 0));
      const formula = `OD:${o.od||'-'} OI:${o.oi||'-'}`;

      const stTs = (o.stateTimestamps && o.stateTimestamps[currState]) ? o.stateTimestamps[currState] : null;
      const values = {
        'Consecutivo': getOrderConsecutivo(o) || '-',
        'Fecha': fechaCortaTs(getOrderDateTs(o)),
        'Paciente': nombreCedula,
        'Fac. Dr Mejia': o.facturaVentaDrMejia || '-',
        'Orden Lab': getOrderLabNumber(o) || '-',
        'Fac. Venta Lab': o.facturaVentaLaboratorio || '-',
        'Proveedor': providerNameById(getOrderProviderId(o)),
        'Sede': sedeNameById(getOrderHeadquarterId(o)),
        'Tipo Lente (Asesor)': o.tipoLenteFiltros || '-',
        'Tipo Lente (Admon)': o.tipoLenteAdmon || '-',
        'Fórmula': formula,
        'Estado': stateBadgeHtml(getOrderState(o)),
        'Fecha estado': stTs ? fechaCortaTs(stTs) : '-',
        'Precio Venta': fmtMoney(o.precioVenta),
        'Precio Costo': fmtMoney(o.precioCosto),
        'Utilidad': fmtMoney(utilidad),
        'Acciones': accionesHtml
      };

      row.innerHTML = visibleCols.map(c => {
        if (c.header === 'Acciones') return values['Acciones'];
        return `<div>${values[c.header]}</div>`;
      }).join('');
      
      container.appendChild(row);
    });
  }
  
  // Exponer acciones globales para los onclick inline
  window.openOrdenDetailsById = (id) => { const o = data.ordenes.find(x => x.id == id); if(o) openOrdenDetails(o); };
  window.editOrderById = (id) => {
    const o = data.ordenes.find(x => Number(x.id) === Number(id));
    if (!o || !formOrden) return;
    try {
      formOrden.dataset.editId = String(o.id);
      // Prefill campos
      if (ordConsecutivoInput) ordConsecutivoInput.value = o.consecutivo || '';
      if (ordNumeroInput) ordNumeroInput.value = o.number || o.numero || '';
      if (ordFechaInput) ordFechaInput.value = (o.shippingDate || o.fecha || '').slice(0,10);
      if (ordFechaEntregaInput) ordFechaEntregaInput.value = (o.deliveryDate || '').slice(0,10);
      if (ordCiudadInput) ordCiudadInput.value = o.ciudad || '';
      if (ordEmpresaInput) ordEmpresaInput.value = o.empresa || '';
      if (ordPacienteInput) ordPacienteInput.value = o.patientName || o.paciente || '';
      if (ordPacienteCCInput) ordPacienteCCInput.value = o.documentPatient || o.pacienteCC || '';
      if (ordProveedorSelect) ordProveedorSelect.value = String(getOrderProviderId(o) || '');
      if (ordHeadquarterInput) { ordHeadquarterInput.disabled = false; ordHeadquarterInput.value = String(getOrderHeadquarterId(o) || ''); }
      if (ordEstadoSelect) ordEstadoSelect.value = String(getOrderState(o) || 'CREATED').toUpperCase();
      if (document.getElementById('ordTipoLenteAdmon')) document.getElementById('ordTipoLenteAdmon').value = o.tipoLenteAdmon || '';
      if (document.getElementById('ordTipoLenteFiltros')) document.getElementById('ordTipoLenteFiltros').value = o.tipoLenteFiltros || '';
      if (document.getElementById('ordClaseLentes')) document.getElementById('ordClaseLentes').value = o.claseLentes || 'progresivo';
      if (document.getElementById('ordOD')) document.getElementById('ordOD').value = o.od || '';
      if (document.getElementById('ordOI')) document.getElementById('ordOI').value = o.oi || '';
      if (document.getElementById('ordADD')) document.getElementById('ordADD').value = o.add || '';
      if (document.getElementById('ordDPALT')) document.getElementById('ordDPALT').value = o.dpAlt || '';
      if (document.getElementById('ordInfoAdicional')) document.getElementById('ordInfoAdicional').value = o.infoAdicional || '';
      if (document.getElementById('ordTipoMontura')) document.getElementById('ordTipoMontura').value = o.tipoMontura || '';
      if (document.getElementById('ordObservaciones')) document.getElementById('ordObservaciones').value = o.observaciones || '';
      if (document.getElementById('ordTiempoControl')) document.getElementById('ordTiempoControl').value = (o.tiempoControl || '').slice(0,10);
      if (document.getElementById('ordFacturaDrMejia')) document.getElementById('ordFacturaDrMejia').value = o.facturaVentaDrMejia || '';
      if (document.getElementById('ordFacturaLab')) document.getElementById('ordFacturaLab').value = o.facturaVentaLaboratorio || '';
      if (document.getElementById('ordPrecioVenta')) document.getElementById('ordPrecioVenta').value = (o.precioVenta ? `$ ${new Intl.NumberFormat('es-CO').format(Number(o.precioVenta))}` : '');
      if (document.getElementById('ordPrecioCosto')) document.getElementById('ordPrecioCosto').value = (o.precioCosto ? `$ ${new Intl.NumberFormat('es-CO').format(Number(o.precioCosto))}` : '');
      openOrdenCreateModal();
    } catch {}
  };
  window.markReturnRouteById = async (id) => {
    const o = data.ordenes.find(x => x.id == id);
    if (!o) return;
    const current = String(getOrderState(o) || '').toUpperCase();
    if (['RETURN_ROUTE','RECEIVED','COMPLETED','CANCELLED'].includes(current)) return;
    try { await window.Api.patch(`/api/orders/${encodeURIComponent(o.id)}`, { state: 'RETURN_ROUTE' }); } catch {}
    try {
      // Si no hay backend, actualizar localmente
      const idx = data.ordenes.findIndex(x => x.id == id);
      if (idx >= 0) {
        const ts = Date.now();
        const prev = data.ordenes[idx];
        const stateTimestamps = { ...(prev.stateTimestamps || {}) };
        stateTimestamps['RETURN_ROUTE'] = ts;
        data.ordenes[idx] = { ...prev, state: 'RETURN_ROUTE', stateTimestamps };
      }
    } catch {}
    try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Orden #${o.id} marcada en retorno`, fecha: Date.now() }); } catch {}
    try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
    renderOrdenes(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
  };

  window.adminSetOrderState = async (id, newState) => {
    const o = data.ordenes.find(x => x.id == id);
    if (!o) return;
    const ns = String(newState || '').toUpperCase();
    if (!['CREATED','SENT','IN_PROGRESS','RETURN_ROUTE','RECEIVED','COMPLETED','CANCELLED'].includes(ns)) return;
    try { await window.Api.patch(`/api/orders/${encodeURIComponent(o.id)}`, { state: ns }); } catch {}
    try {
      const idx = data.ordenes.findIndex(x => x.id == id);
      if (idx >= 0) {
        const ts = Date.now();
        const prev = data.ordenes[idx];
        const stateTimestamps = { ...(prev.stateTimestamps || {}) };
        stateTimestamps[ns] = ts;
        data.ordenes[idx] = { ...prev, state: ns, stateTimestamps };
      }
    } catch {}
    try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
    renderOrdenes(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
  };
  window.payOrderById = async (id) => {
    const o = data.ordenes.find(x => x.id == id);
    if(!o || getOrderPaid(o)) return;
    try { await window.Api.patch(`/api/orders/${encodeURIComponent(o.id)}`, { paid: true }); } catch {}
    try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Orden #${o.id} marcada como pagada`, fecha: Date.now() }); } catch {}
    try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
    renderOrdenes(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
  };
  window.deleteOrderById = async (id) => {
    const o = data.ordenes.find(x => x.id == id);
    if(!o) return;
    try { await window.Api.del(`/api/orders/${encodeURIComponent(o.id)}`); } catch {}
    try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Orden #${o.id} eliminada`, fecha: Date.now() }); } catch {}
    try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
    renderOrdenes(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
  };

  function renderOrdenes() {
    if (!listaOrdenes) return;
    // Leer filtros
    const paciente = document.getElementById('filtroOrdenPaciente')?.value.trim().toLowerCase() || '';
    const provId = document.getElementById('filtroOrdenProveedor')?.value || '';
    const estado = document.getElementById('filtroOrdenEstado')?.value || '';
    const fecha = document.getElementById('filtroOrdenFecha')?.value || '';

    // Filtrar
    let ordenes = data.ordenes.filter(o => {
      const pName = getOrderPatientDisplay(o).toLowerCase();
      if (paciente && !pName.includes(paciente)) return false;
      if (provId && String(getOrderProviderId(o)) !== provId) return false;
      const stCode = String(getOrderState(o) || '').toUpperCase();
      if (estado && stCode !== estado) return false;
      if (fecha) {
        const orderDate = new Date(getOrderDateTs(o)).toISOString().slice(0,10);
        if (orderDate !== fecha) return false;
      }
      return true;
    });
    // Restricción por sede para asistentes
    try {
      const role = getRole();
      if (role === 'assistant') {
        const assigned = getAssistantAssignedHeadquarterId();
        if (assigned) ordenes = ordenes.filter(o => String(getOrderHeadquarterId(o)) === String(assigned));
      }
    } catch {}

    // Ordenar
    try {
      ordenes.sort((a, b) => {
        const cb = Number(b.createdAt ?? 0);
        const ca = Number(a.createdAt ?? 0);
        if (cb && ca && cb !== ca) return cb - ca;
        return Number((b.id ?? 0)) - Number((a.id ?? 0));
      });
    } catch {}

    renderOrderTable(listaOrdenes, ordenes);
  }

  const ordPanel = main.querySelector('[data-section="ordenes"]');
  function activateTab(panel, targetSel) {
    const tabs = panel.querySelectorAll('.tabs .tab');
    const targets = Array.from(tabs).map(t => t.getAttribute('data-target'));
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === targetSel));
    targets.forEach(sel => {
      const el = panel.querySelector(sel);
      if (el) el.hidden = (sel !== targetSel);
    });
  }
  // ---- Modal de creación de órdenes ----
  let ordenCreateOverlay = null;
  let formOriginalParent = null;
  let formOriginalNextSibling = null;

  function openOrdenCreateModal() {
    if (!formOrden) return;
    try { refreshProveedorOptions(); } catch {}
    try { refreshHeadquarterOptionsOrden(); } catch {}
    // Crear overlay/modal con estilos inline para evitar depender de CSS externo
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.35)';
    overlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed';
    // Ventana grande: casi a pantalla completa, sin necesidad de scroll horizontal
    modal.style.inset = '2vh 1vw'; // top/bottom/left/right
    modal.style.width = 'auto';
    modal.style.height = 'auto';
    modal.style.maxWidth = '98vw';
    modal.style.maxHeight = '96vh';
    modal.style.overflow = 'auto';
    modal.style.padding = '16px';

    // Contenedor centrado para organizar el contenido del modal
    const content = document.createElement('div');
    content.style.maxWidth = '1200px';
    content.style.margin = '0 auto';
    content.style.padding = '4px';

    // Encabezado del modal (centrado)
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'center';
    header.style.alignItems = 'center';
    header.style.gap = '8px';
    header.style.position = 'relative';
    const isEdit = !!formOrden?.dataset?.editId;
    header.innerHTML = `
      <div>
        <h3 style="margin:0; text-align:center;">${isEdit ? 'Editar orden' : 'Registrar orden'}</h3>
        <div style="color:var(--c-text-light);font-size:13px;text-align:center;">${isEdit ? 'Actualiza la información de la orden' : 'Completa la información de la orden'}</div>
      </div>
      <button class="btn-outline" id="closeCreateOrdenModal" title="Cerrar" style="position:absolute;right:0;top:0"><iconify-icon icon="ph:x"></iconify-icon></button>
    `;

    const body = document.createElement('div');
    body.style.padding = '8px 0';

    // Guardar posición original del formulario para restaurarlo al cerrar
    formOriginalParent = formOrden.parentElement;
    // insertarlo antes de la tabla de órdenes si existe
    const beforeNode = document.getElementById('listaOrdenes');
    formOriginalNextSibling = beforeNode || formOrden.nextElementSibling;

    // Mostrar el formulario dentro del modal
    formOrden.hidden = false;
    body.appendChild(formOrden);

    content.appendChild(header);
    content.appendChild(body);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
      try {
        // Ocultar y restaurar el formulario a su contenedor original
        formOrden.hidden = true;
        if (formOriginalParent) {
          if (formOriginalNextSibling && formOriginalNextSibling.parentElement === formOriginalParent) {
            formOriginalParent.insertBefore(formOrden, formOriginalNextSibling);
          } else {
            formOriginalParent.appendChild(formOrden);
          }
        }
        document.body.removeChild(overlay);
        ordenCreateOverlay = null;
      } catch {}
    }

    const closeBtn = modal.querySelector('#closeCreateOrdenModal');
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    ordenCreateOverlay = overlay;
    // Enfocar el primer campo al abrir
    setTimeout(() => { try { ordPacienteInput && ordPacienteInput.focus(); } catch {} }, 50);

    // Formateador de moneda en vivo
    const formatCurrencyInput = (e) => {
      // Eliminar todo lo que no sea números
      let val = e.target.value.replace(/\D/g, '');
      if (!val) { e.target.value = ''; return; }
      // Formatear con puntos de miles
      e.target.value = '$ ' + new Intl.NumberFormat('es-CO').format(parseInt(val, 10));
    };
    // Parseador para obtener el número limpio
    const parseCurrency = (str) => {
      if (!str) return 0;
      return parseInt(str.replace(/\D/g, ''), 10) || 0;
    };

    const role = getRole();
    const isAssistant = role === 'assistant';
    const isProvider = role === 'provider';
    const inVenta = document.getElementById('ordPrecioVenta');
    const inCosto = document.getElementById('ordPrecioCosto');
    const recibidoPorInput = document.getElementById('ordRecibidoPor');
    const recibidoPorField = recibidoPorInput ? recibidoPorInput.closest('.field') : null;
  if (inVenta) {
    inVenta.addEventListener('input', formatCurrencyInput);
    // Ocultar para proveedores
    if (isProvider) inVenta.closest('.field').style.display = 'none';
  }
  if (inCosto) {
    inCosto.addEventListener('input', formatCurrencyInput);
    if (isAssistant) inCosto.closest('.field').style.display = 'none';
  }

    // Ocultar otros campos según rol en el formulario de creación
  const inTipoLenteAdmon = document.getElementById('ordTipoLenteAdmon');
  if (inTipoLenteAdmon && isAssistant) inTipoLenteAdmon.closest('.field').style.display = 'none';
  // Mostrar "Recibido por" solo cuando estado = RECEIVED
  const syncRecibidoPorVisibility = () => {
    try {
      const val = String(ordEstadoSelect?.value || '').toUpperCase();
      if (recibidoPorField) recibidoPorField.style.display = (val === 'RECEIVED' ? '' : 'none');
    } catch {}
  };
  syncRecibidoPorVisibility();
  if (ordEstadoSelect) ordEstadoSelect.addEventListener('change', syncRecibidoPorVisibility);
    
    const inTipoLenteAsesor = document.getElementById('ordTipoLenteFiltros');
    if (inTipoLenteAsesor && isProvider) inTipoLenteAsesor.closest('.field').style.display = 'none';

  }

  if (btnNuevaOrden) btnNuevaOrden.addEventListener('click', () => { openOrdenCreateModal(); });
  // Filtros órdenes
  ['filtroOrdenPaciente','filtroOrdenProveedor','filtroOrdenEstado','filtroOrdenFecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderOrdenes);
  });
  const limpiarOrd = document.getElementById('limpiarFiltrosOrden');
  if (limpiarOrd) limpiarOrd.addEventListener('click', () => {
    ['filtroOrdenPaciente','filtroOrdenProveedor','filtroOrdenEstado','filtroOrdenFecha'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderOrdenes();
  });
  if (cancelOrden) cancelOrden.addEventListener('click', (e) => { 
    e.preventDefault();
    if (ordenCreateOverlay) { try { ordenCreateOverlay.dispatchEvent(new Event('click')); } catch {} }
    else { if (ordPanel) activateTab(ordPanel, '#listaOrdenes'); if (formOrden) formOrden.hidden = true; }
  });
  // Interceptar tab "Crear" para abrir modal horizontal
  const crearTab = ordPanel?.querySelector('.tabs .tab[data-target="#formOrden"]');
  if (crearTab) crearTab.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); openOrdenCreateModal(); });
  if (formOrden) formOrden.addEventListener('submit', async (e) => {
    e.preventDefault();
    const paciente = ordPacienteInput.value.trim();
    const proveedorId = ordProveedorSelect.value;
    markField('ordPaciente', !!paciente, 'El paciente es obligatorio');
    markField('ordProveedor', !!proveedorId, 'Debes seleccionar un proveedor');
    if (!paciente || !proveedorId) return;
    // Parseador para obtener el número limpio
    const parseCurrency = (str) => {
      if (!str) return 0;
      if (typeof str === 'number') return str;
      return parseInt(str.replace(/\D/g, ''), 10) || 0;
    };

    const fechaStr = (ordFechaInput && ordFechaInput.value) ? ordFechaInput.value : '';
    const deliveryStr = (ordFechaEntregaInput && ordFechaEntregaInput.value) ? ordFechaEntregaInput.value : '';
    
    // Capturar nuevos campos
    const facturaDrMejia = document.getElementById('ordFacturaDrMejia')?.value.trim();
    const facturaLab = document.getElementById('ordFacturaLab')?.value.trim();
    const tipoLenteAdmon = document.getElementById('ordTipoLenteAdmon')?.value.trim();
    const recibidoPor = document.getElementById('ordRecibidoPor')?.value.trim();
    
    // Usar el parser de moneda para obtener el valor numérico real
    const precioVentaRaw = document.getElementById('ordPrecioVenta')?.value || '0';
    const precioCostoRaw = document.getElementById('ordPrecioCosto')?.value || '0';
    const precioVenta = parseCurrency(precioVentaRaw);
    const precioCosto = parseCurrency(precioCostoRaw);

    const tipoLenteFiltros = document.getElementById('ordTipoLenteFiltros')?.value.trim();
    const claseLentes = document.getElementById('ordClaseLentes')?.value;
    
    // Valores ópticos
    const od = document.getElementById('ordOD')?.value.trim();
    const oi = document.getElementById('ordOI')?.value.trim();
    const add = document.getElementById('ordADD')?.value.trim();
    const dpAlt = document.getElementById('ordDPALT')?.value.trim();
    const infoAdicional = document.getElementById('ordInfoAdicional')?.value.trim();
    const tipoMontura = document.getElementById('ordTipoMontura')?.value.trim();
    const observaciones = document.getElementById('ordObservaciones')?.value.trim();
    const tiempoControl = document.getElementById('ordTiempoControl')?.value || '';

    const currState = String(ordEstadoSelect?.value || 'CREATED').toUpperCase();
    const payload = {
      consecutivo: (ordConsecutivoInput?.value || '').trim(),
      number: (ordNumeroInput?.value || '').trim(), // Orden Lab
      documentPatient: (ordPacienteCCInput?.value || '').trim(),
      patientName: paciente,
      idHeadquarter: (getRole()==='assistant' ? Number(getAssistantAssignedHeadquarterId() || ordHeadquarterInput?.value || 0) : Number(ordHeadquarterInput?.value || 0)),
      idProvider: Number(proveedorId),
      shippingDate: fechaStr || '',
      deliveryDate: deliveryStr || undefined,
      state: currState,
      paid: false,
      // Nuevos campos
      facturaVentaDrMejia: facturaDrMejia,
      facturaVentaLaboratorio: facturaLab,
      tipoLenteAdmon: tipoLenteAdmon,
      precioVenta: precioVenta,
      precioCosto: precioCosto,
      tipoLenteFiltros: tipoLenteFiltros,
      claseLentes: claseLentes,
      od: od, oi: oi, add: add, dpAlt: dpAlt,
      infoAdicional: infoAdicional,
      tipoMontura: tipoMontura,
      observaciones: observaciones,
      tiempoControl: tiempoControl,
      receivedBy: (currState === 'RECEIVED' ? recibidoPor : undefined)
    };
    const editingId = formOrden.dataset.editId ? Number(formOrden.dataset.editId) : null;
    let createdLocal = false;
    if (!editingId) {
      try {
        if (window.Api && window.Api.isEnabled()) {
          await window.Api.post('/api/orders', payload);
        } else {
          throw new Error('API no habilitada');
        }
      } catch (_) {
        const nextId = (Math.max(0, ...data.ordenes.map(o => Number(o.id) || 0)) || 100) + 1;
        const ord = { id: nextId, ...payload, createdAt: Date.now(), stateTimestamps: { [payload.state]: Date.now() } };
        data.ordenes.unshift(ord);
        createdLocal = true;
      }
    } else {
      try {
        if (window.Api && window.Api.isEnabled()) {
          await window.Api.patch(`/api/orders/${encodeURIComponent(editingId)}`, payload);
        } else {
          throw new Error('API no habilitada');
        }
      } catch (_) {
        const idx = data.ordenes.findIndex(o => Number(o.id) === Number(editingId));
        if (idx >= 0) {
          const prev = data.ordenes[idx];
          const newState = String(payload.state || prev.state).toUpperCase();
          const oldState = String(prev.state || '').toUpperCase();
          const stateTimestamps = { ...(prev.stateTimestamps || {}) };
          if (newState && newState !== oldState) stateTimestamps[newState] = Date.now();
          data.ordenes[idx] = { ...prev, ...payload, id: prev.id, createdAt: prev.createdAt, stateTimestamps };
        }
      }
    }
    try { data.notificaciones.push({ id: Date.now(), para: 'provider', mensaje: `Orden registrada para ${providerNameById(Number(proveedorId))}`, fecha: Date.now() }); } catch {}
    try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
    // Cerrar modal y limpiar
    formOrden.reset(); delete formOrden.dataset.editId;
    if (ordenCreateOverlay) {
      try { ordenCreateOverlay.dispatchEvent(new Event('click')); } catch {}
    } else {
      formOrden.hidden = true;
    }
    renderOrdenes(); updateKPIsAndChart(); updateCharts(); try { renderNotificaciones(); } catch {}
  });

  // ---- Estado: etiqueta con color ----
  function stateInfo(st) {
    const s = String(st || '').toUpperCase();
    switch (s) {
      case 'CREATED': return { label: 'Crear', color: '#3b82f6' };
      case 'SENT': return { label: 'Enviado a lab', color: '#6366f1' };
      case 'IN_PROGRESS': return { label: 'En proceso', color: '#f59e0b' };
      case 'RETURN_ROUTE': return { label: 'Retorno en ruta', color: '#eab308' };
      case 'RECEIVED': return { label: 'Recibido', color: '#8b5cf6' };
      case 'COMPLETED': return { label: 'Completa', color: '#10b981' };
      case 'CANCELLED': return { label: 'Anulado', color: '#6b7280' };
      default: return { label: st || '-', color: '#9ca3af' };
    }
  }
  function stateBadgeHtml(st) {
    const info = stateInfo(st);
    return `<span class="state-badge" style="--bg:${info.color};">${info.label}</span>`;
  }

  // Captura rápida eliminada: la creación se hace en el tab 'Crear' horizontal

  function markField(id, ok, msg) {
    const el = document.getElementById(id);
    const field = el?.closest('.field');
    const hint = document.getElementById(id + 'Hint');
    if (!field) return;
    field.classList.toggle('invalid', !ok);
    if (hint) hint.textContent = ok ? '' : (msg || 'Campo inválido');
  }
  
  /* =========================================
     MÓDULO PROVEEDORES
     ========================================= */
  const listaProveedores = document.getElementById('listaProveedores');
  const formProveedor = document.getElementById('formProveedor');
  const btnNuevoProveedor = document.getElementById('btnNuevoProveedor');
  const cancelProveedor = document.getElementById('cancelProveedor');
  const provNitInput = document.getElementById('provNit');
  const provNameInput = document.getElementById('provName');
  const provAddressInput = document.getElementById('provAddress');
  const provEmailInput = document.getElementById('provEmail');
  const provPhoneInput = document.getElementById('provPhone');

  function renderProveedores() {
    if (!listaProveedores) return;
    const nombre = document.getElementById('filtroProvNombre')?.value.trim().toLowerCase() || '';
    const contacto = document.getElementById('filtroProvContacto')?.value.trim().toLowerCase() || '';
    
    let proveedores = data.proveedores.filter(p => {
      const nm = (p.name || p.nombre || '').toLowerCase();
      const mailPhone = ((p.email || p.contacto || '') + ' ' + (p.phone || '')).toLowerCase();
      if (nombre && !nm.includes(nombre)) return false;
      if (contacto && !mailPhone.includes(contacto)) return false;
      return true;
    });

    listaProveedores.innerHTML = '';
    const gridTemplate = '100px 1.5fr 1fr 100px 1fr 80px 140px';
    const head = document.createElement('div'); 
    head.className = 'table-row table-head'; 
    head.style.gridTemplateColumns = gridTemplate;
    head.innerHTML = '<div>NIT</div><div>Nombre</div><div>Email</div><div>Teléfono</div><div>Dirección</div><div>Órdenes</div><div>Acciones</div>';
    listaProveedores.appendChild(head);

    if (proveedores.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay proveedores con esos filtros.';
      listaProveedores.appendChild(empty);
    } else {
      proveedores.forEach((p, idx) => {
        const row = document.createElement('div'); 
        row.className = 'table-row';
        row.style.gridTemplateColumns = gridTemplate;
        
        // Count orders
        const ordersCount = data.ordenes.filter(o => String(getOrderProviderId(o)) === String(p.id)).length;

        const accionesHtml = `<div class="acciones">
          <button class="btn-outline btn-sm" data-action="edit" title="Editar"><iconify-icon icon="ph:pencil"></iconify-icon> <span class="label">Editar</span></button>
          <button class="btn-outline btn-sm" data-action="delete" title="Eliminar"><iconify-icon icon="ph:trash"></iconify-icon> <span class="label">Eliminar</span></button>
        </div>`;
        
        row.innerHTML = `<div>${p.nit || ''}</div><div>${p.name || p.nombre || ''}</div><div>${p.email || ''}</div><div>${p.phone || ''}</div><div>${p.address || ''}</div><div>${ordersCount}</div>${accionesHtml}`;
        
        // Edit
        row.querySelector('button[data-action="edit"]').addEventListener('click', () => {
             if(provNitInput) provNitInput.value = p.nit || '';
             if(provNameInput) provNameInput.value = p.name || p.nombre || '';
             if(provAddressInput) provAddressInput.value = p.address || '';
             if(provEmailInput) provEmailInput.value = p.email || '';
             if(provPhoneInput) provPhoneInput.value = p.phone || '';
             
             if(formProveedor) formProveedor.dataset.editId = p.id;
             toggleProveedorForm(true);
        });

        // Delete
        row.querySelector('button[data-action="delete"]').addEventListener('click', async () => {
          if(!confirm(`¿Eliminar proveedor ${p.name || p.nombre}?`)) return;
          const nombreEliminado = p.name || p.nombre || '';
          try { await window.Api.del(`/api/providers/${encodeURIComponent(p.id)}`); } catch {}
          try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Proveedor "${nombreEliminado}" eliminado`, fecha: Date.now() }); } catch {}
          try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
          // Local fallback removal
          const realIdx = data.proveedores.findIndex(x => x.id === p.id);
          if(realIdx > -1) data.proveedores.splice(realIdx, 1);
          Store.save(data);
          
          renderProveedores(); updateKPIsAndChart();
          try { refreshProveedorOptions(); } catch {}
          try { refreshProveedorOptionsReportes(); } catch {}
          try { renderNotificaciones(); } catch {}
        });
        listaProveedores.appendChild(row);
      });
    }
  }

  const provPanel = main.querySelector('[data-section="proveedores"]');
  function activateTab(panel, targetSel) {
    const tabs = panel.querySelectorAll('.tabs .tab');
    const targets = Array.from(tabs).map(t => t.getAttribute('data-target'));
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === targetSel));
    targets.forEach(sel => {
      const el = panel.querySelector(sel);
      if (el) el.hidden = (sel !== targetSel);
    });
  }
  function toggleProveedorForm(show) { if (provPanel) activateTab(provPanel, show ? '#formProveedor' : '#listaProveedores'); }
  function setProveedorTabPersist(show) { localStorage.setItem('tab_proveedores', show ? '#formProveedor' : '#listaProveedores'); }
  
  if (btnNuevoProveedor) btnNuevoProveedor.addEventListener('click', () => { 
      if(formProveedor) { formProveedor.reset(); delete formProveedor.dataset.editId; }
      toggleProveedorForm(true); setProveedorTabPersist(true); 
  });

  // Filtros proveedores
  ['filtroProvNombre','filtroProvContacto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderProveedores);
  });
  const limpiarProv = document.getElementById('limpiarFiltrosProv');
  if (limpiarProv) limpiarProv.addEventListener('click', () => {
    ['filtroProvNombre','filtroProvContacto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderProveedores();
  });
  
  if (cancelProveedor) cancelProveedor.addEventListener('click', () => { toggleProveedorForm(false); setProveedorTabPersist(false); });
  
  if (formProveedor) formProveedor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = formProveedor.dataset.editId;
    
    const nit = provNitInput?.value.trim();
    const name = provNameInput?.value.trim();
    const address = provAddressInput?.value.trim();
    const email = provEmailInput?.value.trim();
    const phone = provPhoneInput?.value.trim();
    
    markField('provNit', !!nit && nit.length >= 3, 'NIT mínimo 3 caracteres');
    markField('provName', !!name, 'El nombre es obligatorio');
    markField('provAddress', !!address, 'La dirección es obligatoria');
    markField('provEmail', !!email && email.includes('@'), 'Email inválido');
    markField('provPhone', !!phone, 'El teléfono es obligatorio');
    
    if (!(nit && nit.length >= 3 && name && address && email.includes('@') && phone)) return;
    
    const payload = { nit, name, address, email, phone };
    
    try {
      if (editId) {
          // Edit
          await window.Api.patch(`/api/providers/${encodeURIComponent(editId)}`, payload);
          const local = data.proveedores.find(p => p.id == editId);
          if(local) Object.assign(local, payload);
      } else {
          // Create
          if (window.Api && window.Api.isEnabled()) {
            await window.Api.post('/api/providers', payload);
          } else {
            throw new Error('API no habilitada');
          }
      }
    } catch (_) {
      if (!editId) {
          const nextId = (Math.max(0, ...data.proveedores.map(p => Number(p.id) || 0)) || 0) + 1;
          data.proveedores.push({ id: nextId, ...payload });
      }
      Store.save(data);
    }
    
    try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Proveedor "${name}" ${editId ? 'actualizado' : 'registrado'}`, fecha: Date.now() }); } catch {}
    
    try { const remote = await loadRemoteData(); if (remote) data = remote; } catch {}
    try { refreshProveedorOptions(); } catch {}
    
    formProveedor.reset(); delete formProveedor.dataset.editId;
    toggleProveedorForm(false); setProveedorTabPersist(false);
    renderProveedores();
    try { refreshProveedorOptionsReportes(); } catch {}
    toggleProveedorForm(false);
    formProveedor.reset();
    renderProveedores(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
  });

  /* =========================================
     MÓDULO NOTIFICACIONES
     ========================================= */
  const listaNotificaciones = document.getElementById('listaNotificaciones');

  function renderNotificaciones() {
    if (!listaNotificaciones) return;
    listaNotificaciones.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.style.gridTemplateColumns = '1fr 1fr 2fr auto';
    head.innerHTML = '<div>Fecha</div><div>Para</div><div>Mensaje</div><div>Acciones</div>';
    listaNotificaciones.appendChild(head);
    const arr = Array.isArray(data.notificaciones) ? data.notificaciones : [];
    if (arr.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay notificaciones automáticas todavía.';
      listaNotificaciones.appendChild(empty);
    } else {
      arr.forEach((n, idx) => {
        const row = document.createElement('div'); row.className = 'table-row'; row.style.gridTemplateColumns = '1fr 1fr 2fr auto';
        const accionesHtml = `<div class=\"acciones\"><button class=\"btn-outline btn-sm\" data-idx=\"${idx}\" title=\"Eliminar\"><iconify-icon icon=\"ph:trash\"></iconify-icon><span class=\"label\">Eliminar</span></button></div>`;
        row.innerHTML = `<div>${fechaCorta(n.fecha)}</div><div>${n.para}</div><div>${n.mensaje}</div>${accionesHtml}`;
        row.querySelector('button').addEventListener('click', () => {
          data.notificaciones.splice(idx, 1);
          Store.save(data);
          renderNotificaciones();
        });
        listaNotificaciones.appendChild(row);
      });
    }
  }

  // Notificaciones son automáticas (generadas en eventos de orden, pagos, proveedores). No hay envío manual.

  function setupPanelTabs(sectionName) {
    const panel = main.querySelector(`[data-section="${sectionName}"]`);
    if (!panel) return;
    const tabs = panel.querySelectorAll('.tabs .tab');
    const tabKey = `tab_${sectionName}`;
    tabs.forEach(tab => tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSel = tab.getAttribute('data-target');
      activateTab(panel, targetSel);
      localStorage.setItem(tabKey, targetSel);
    }));
    const initialSaved = localStorage.getItem(tabKey);
    const targets = Array.from(tabs).map(t => t.getAttribute('data-target'));
    const initialTarget = sectionName === 'ordenes'
      ? '#listaOrdenes'
      : (initialSaved && targets.includes(initialSaved)
        ? initialSaved
        : (panel.querySelector('.tabs .tab.active') || tabs[0])?.getAttribute('data-target'));
    if (initialTarget) activateTab(panel, initialTarget);
  }
  // ---------- Reportes ----------
  const reporteDesde = document.getElementById('reporteDesde');
  const reporteHasta = document.getElementById('reporteHasta');
  const reporteProveedor = document.getElementById('reporteProveedor');
  const btnGenerarReporte = document.getElementById('btnGenerarReporte');
  const btnLimpiarReporte = document.getElementById('btnLimpiarReporte');
  const resumenReporte = document.getElementById('resumenReporte');
  const tablaPagosReporte = document.getElementById('tablaPagosReporte');
  const tablaOrdenesReporte = document.getElementById('tablaOrdenesReporte');

  function refreshProveedorOptionsReportes() {
    if (!reporteProveedor) return;
    const current = reporteProveedor.value;
    reporteProveedor.innerHTML = '<option value="">Todos</option>';
    data.proveedores.forEach(p => {
      const opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = (p.name || p.nombre || p.nit || String(p.id));
      reporteProveedor.appendChild(opt);
    });
    if (Array.from(reporteProveedor.options).some(o => o.value === current)) reporteProveedor.value = current;
  }

  function parseDateInput(el) {
    if (!el || !el.value) return null;
    const parts = el.value.split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
    return d.getTime();
  }

  function inRange(ts, fromTs, toTs) {
    if (fromTs && ts < fromTs) return false;
    if (toTs && ts > toTs + 24*60*60*1000 - 1) return false;
    return true;
  }

  function downloadExcel(filename, rows, sheetName = 'Reporte') {
    if (typeof XLSX === 'undefined' || !XLSX || !XLSX.utils) {
      alert('No se pudo cargar la librería para Excel.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  function renderTablaPagos(pagos) {
    if (!tablaPagosReporte) return;
    tablaPagosReporte.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
    head.innerHTML = '<div>Orden</div><div>Proveedor</div><div>Monto</div><div>Fecha</div><div>Comprobante</div>';
    tablaPagosReporte.appendChild(head);
    if (!pagos.length) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'Sin pagos en el rango.'; tablaPagosReporte.appendChild(empty);
      return;
    }
    pagos.forEach(p => {
      const row = document.createElement('div'); row.className = 'table-row'; row.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
      row.innerHTML = `<div>#${p.ordenId}</div><div>${providerNameById(p.proveedorId)}</div><div>$${Number(p.monto).toFixed(2)}</div><div>${fechaCorta(p.fecha)}</div><div>${p.comprobante || ''}</div>`;
      tablaPagosReporte.appendChild(row);
    });
  }

  function renderTablaOrdenes(ordenes) {
    if (!tablaOrdenesReporte) return;
    tablaOrdenesReporte.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 1fr';
    head.innerHTML = '<div>ID</div><div>Paciente</div><div>Proveedor</div><div>Estado</div><div>Pagada</div><div>Fecha</div>';
    tablaOrdenesReporte.appendChild(head);
    if (!ordenes.length) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'Sin órdenes en el rango.'; tablaOrdenesReporte.appendChild(empty);
      return;
    }
    ordenes.forEach(o => {
      const ts = getOrderDateTs(o);
      const row = document.createElement('div'); row.className = 'table-row'; row.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 1fr';
      row.innerHTML = `<div>#${o.number || o.id}</div><div>${getOrderPatientDisplay(o)}</div><div>${providerNameById(getOrderProviderId(o))}</div><div>${getOrderState(o)}</div><div>${getOrderPaid(o) ? 'Sí' : 'No'}</div><div>${fechaCorta(ts)}</div>`;
      tablaOrdenesReporte.appendChild(row);
    });
  }

  function generarReporte() {
    const fromTs = parseDateInput(reporteDesde);
    const toTs = parseDateInput(reporteHasta);
    const provId = reporteProveedor && reporteProveedor.value ? Number(reporteProveedor.value) : null;

    const pagosAll = (data.pagos || []).map(p => ({ ...p, proveedorId: (data.ordenes.find(o => o.id === p.ordenId)?.proveedorId) }));
    const pagosFiltrados = pagosAll.filter(p => inRange(p.fecha, fromTs, toTs) && (!provId || p.proveedorId === provId));

    const ordenesAll = data.ordenes || [];
    const ordenesFiltradas = ordenesAll.filter(o => {
      const ts = getOrderDateTs(o);
      const pid = getOrderProviderId(o);
      return inRange(ts, fromTs, toTs) && (!provId || pid === provId);
    });

    const totalPagos = pagosFiltrados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const ordenesPagadas = ordenesFiltradas.filter(o => getOrderPaid(o)).length;
    const ordenesNoPagadas = ordenesFiltradas.filter(o => !getOrderPaid(o)).length;
    const promedioPago = pagosFiltrados.length ? (totalPagos / pagosFiltrados.length) : 0;

    if (resumenReporte) {
      resumenReporte.innerHTML = '';
      const items = [
        { label: 'Órdenes (rango)', value: String(ordenesFiltradas.length) },
        { label: 'Órdenes pagadas', value: String(ordenesPagadas) },
        { label: 'Órdenes sin pagar', value: String(ordenesNoPagadas) },
        { label: 'Pagos (rango)', value: String(pagosFiltrados.length) },
        { label: 'Monto pagado', value: `$${totalPagos.toFixed(2)}` },
        { label: 'Promedio pago', value: `$${promedioPago.toFixed(2)}` },
      ];
      items.forEach(kpi => {
        const el = document.createElement('div'); el.className = 'kpi'; el.innerHTML = `<div class="kpi-label">${kpi.label}</div><div class="kpi-value">${kpi.value}</div>`; resumenReporte.appendChild(el);
      });
    }

    renderTablaPagos(pagosFiltrados);
    renderTablaOrdenes(ordenesFiltradas);
    updateReportCharts({ pagosFiltrados, ordenesFiltradas, fromTs, toTs });

    const btnPagos = document.getElementById('exportPagosCSV');
    if (btnPagos) btnPagos.onclick = () => {
      const rows = [ ['Orden','Proveedor','Monto','Fecha','Comprobante'], ...pagosFiltrados.map(p => [ `#${p.ordenId}`, providerNameById(p.proveedorId), Number(p.monto).toFixed(2), fechaCorta(p.fecha), p.comprobante || '' ]) ];
      downloadExcel('pagos_reporte.xlsx', rows, 'Pagos');
    };
    const btnOrd = document.getElementById('exportOrdenesCSV');
    if (btnOrd) btnOrd.onclick = () => {
      const rows = [ ['ID','Paciente','Proveedor','Estado','Pagada','Fecha'], ...ordenesFiltradas.map(o => { const ts = getOrderDateTs(o); return [ `#${o.number || o.id}`, getOrderPatientDisplay(o), providerNameById(getOrderProviderId(o)), getOrderState(o), getOrderPaid(o) ? 'Sí' : 'No', fechaCorta(ts) ]; }) ];
      downloadExcel('ordenes_reporte.xlsx', rows, 'Ordenes');
    };
  }

  // --------- Charts de Reportes ---------
  function updateReportCharts({ pagosFiltrados, ordenesFiltradas, fromTs, toTs }) {
    const repPagosEl = document.getElementById('chartReportPagosCanvas');
    if (repPagosEl && typeof Chart !== 'undefined') {
      let days = [];
      if (fromTs && toTs && toTs >= fromTs) {
        const start = new Date(fromTs); const end = new Date(toTs);
        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const maxDays = 31;
        let cur = s.getTime(); let i = 0;
        while (cur <= e.getTime() && i < maxDays) { days.push(new Date(cur)); cur += 24*60*60*1000; i++; }
        if (cur <= e.getTime()) {
          const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
          days = Array.from({ length: maxDays }, (_, k) => { const d = new Date(last); d.setDate(last.getDate() - (maxDays - 1 - k)); return d; });
        }
      } else {
        const now = new Date();
        days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - (6 - i)); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); });
      }
      const labels = days.map(d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`);
      const sums = days.map(d => {
        const dayStart = d.getTime(); const dayEnd = dayStart + 24*60*60*1000;
        return pagosFiltrados.filter(p => p.fecha >= dayStart && p.fecha < dayEnd).reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
      });
      if (!charts.reportPagos) {
        charts.reportPagos = new Chart(repPagosEl, {
          type: 'line',
          data: { labels, datasets: [{ label: 'Pagos', data: sums, borderColor: 'rgba(76,119,255,0.9)', backgroundColor: 'rgba(76,119,255,0.25)', tension: 0.35, fill: true }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
      } else {
        charts.reportPagos.data.labels = labels;
        charts.reportPagos.data.datasets[0].data = sums;
        charts.reportPagos.update();
      }
    }

    const repEstadosEl = document.getElementById('chartReportEstadosCanvas');
    if (repEstadosEl && typeof Chart !== 'undefined') {
      const labels = ['CREATED','SENT','IN_PROGRESS','RETURN_ROUTE','RECEIVED','CANCELLED'];
      const counts = labels.map(e => ordenesFiltradas.filter(o => String(getOrderState(o)).toUpperCase() === e).length);
      if (!charts.reportEstados) {
        charts.reportEstados = new Chart(repEstadosEl, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Órdenes', data: counts, backgroundColor: [ 'rgba(59,130,246,0.6)', 'rgba(99,102,241,0.6)', 'rgba(245,158,11,0.6)', 'rgba(234,179,8,0.6)', 'rgba(139,92,246,0.6)', 'rgba(107,114,128,0.6)' ], borderRadius: 8 }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
      } else {
        charts.reportEstados.data.datasets[0].data = counts;
        charts.reportEstados.data.labels = labels;
        charts.reportEstados.update();
      }
    }
  }
  
  // ---------- Setup Reportes ----------
  function setupReportes() {
    // Prefill date range (last 7 days) if empty
    const today = new Date();
    const toStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const from = new Date(today); from.setDate(today.getDate() - 6);
    const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2,'0')}-${String(from.getDate()).padStart(2,'0')}`;
    if (reporteHasta && !reporteHasta.value) reporteHasta.value = toStr;
    if (reporteDesde && !reporteDesde.value) reporteDesde.value = fromStr;

    // Ensure provider options are current
    refreshProveedorOptionsReportes();

    // Hook events
    if (btnGenerarReporte) btnGenerarReporte.addEventListener('click', (e) => { e.preventDefault(); generarReporte(); });
    if (btnLimpiarReporte) btnLimpiarReporte.addEventListener('click', (e) => {
      e.preventDefault();
      if (reporteDesde) reporteDesde.value = '';
      if (reporteHasta) reporteHasta.value = '';
      if (reporteProveedor) reporteProveedor.value = '';
      if (resumenReporte) resumenReporte.innerHTML = '';
      if (tablaPagosReporte) tablaPagosReporte.innerHTML = '';
      if (tablaOrdenesReporte) tablaOrdenesReporte.innerHTML = '';
      updateReportCharts({ pagosFiltrados: [], ordenesFiltradas: [], fromTs: null, toTs: null });
    });
    if (reporteDesde) reporteDesde.addEventListener('change', () => generarReporte());
    if (reporteHasta) reporteHasta.addEventListener('change', () => generarReporte());
  if (reporteProveedor) reporteProveedor.addEventListener('change', () => generarReporte());

  // Initial render
  generarReporte();

  // Inicializar paneles nuevos
  renderSedes();
  renderUsuarios();
  }
  function setupStatsSede() {
    const sedeSel = document.getElementById('filtroSedeStats');
    const desde = document.getElementById('statsSedeDesde');
    const hasta = document.getElementById('statsSedeHasta');
    const btnGen = document.getElementById('btnGenerarStatsSede');
    const btnClr = document.getElementById('btnLimpiarStatsSede');
    const content = document.getElementById('statsSedeContent');
    const empty = document.getElementById('statsSedeEmpty');
    if (sedeSel) {
      sedeSel.innerHTML = '<option value="">Selecciona una sede...</option>';
      (Array.isArray(data.sedes) ? data.sedes : []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = String(s.id);
        opt.textContent = s.name || s.nombre || `Sede ${s.id}`;
        sedeSel.appendChild(opt);
      });
    }
    const today = new Date();
    const toStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const from = new Date(today); from.setMonth(today.getMonth() - 2);
    const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2,'0')}-${String(from.getDate()).padStart(2,'0')}`;
    if (hasta && !hasta.value) hasta.value = toStr;
    if (desde && !desde.value) desde.value = fromStr;
    const generar = () => {
      const sedeId = sedeSel?.value || '';
      const dStr = desde?.value || '';
      const hStr = hasta?.value || '';
      const dTs = dStr ? Date.parse(dStr) : null;
      const hTs = hStr ? Date.parse(hStr) + 24*60*60*1000 - 1 : null;
      const ordAll = Array.isArray(data.ordenes) ? data.ordenes : [];
      const ordFil = ordAll.filter(o => {
        const sid = String(getOrderHeadquarterId(o) || '');
        if (sedeId && sid !== sedeId) return false;
        const ts = getOrderDateTs(o);
        if (dTs && ts < dTs) return false;
        if (hTs && ts > hTs) return false;
        return true;
      });
      const pagosAll = Array.isArray(data.pagos) ? data.pagos : [];
      const pagosFil = pagosAll.filter(p => {
        const ord = ordFil.find(o => String(o.id) === String(p.ordenId));
        if (!ord) return false;
        const ts = p.fecha || 0;
        if (dTs && ts < dTs) return false;
        if (hTs && ts > hTs) return false;
        return true;
      });
      renderStatsSede({ sedeId, ordFil, pagosFil });
      if (content) content.hidden = ordFil.length === 0;
      if (empty) empty.hidden = ordFil.length !== 0;
    };
    if (btnGen) btnGen.addEventListener('click', (e) => { e.preventDefault(); generar(); });
    if (btnClr) btnClr.addEventListener('click', (e) => { e.preventDefault(); if (sedeSel) sedeSel.value=''; if (desde) desde.value=''; if (hasta) hasta.value=''; const c = document.getElementById('resumenStatsSede'); if (c) c.innerHTML=''; generar(); });
  }
  function renderStatsSede(ctx) {
    const sedeId = ctx.sedeId;
    const ord = ctx.ordFil;
    const pagos = ctx.pagosFil;
    const resumen = document.getElementById('resumenStatsSede');
    if (resumen) {
      const totalOrdenes = ord.length;
      const totalVenta = ord.reduce((s, o) => s + Number(o.precioVenta || 0), 0);
      const totalCosto = ord.reduce((s, o) => s + Number(o.precioCosto || 0), 0);
      const margen = totalVenta - totalCosto;
      const ticketProm = totalOrdenes ? (totalVenta / totalOrdenes) : 0;
      resumen.innerHTML = `
        <div class="card"><div class="kpi">${totalOrdenes}</div><div class="kpi-sub">Órdenes</div></div>
        <div class="card"><div class="kpi">$ ${new Intl.NumberFormat('es-CO').format(totalVenta)}</div><div class="kpi-sub">Ventas</div></div>
        <div class="card"><div class="kpi">$ ${new Intl.NumberFormat('es-CO').format(margen)}</div><div class="kpi-sub">Margen bruto</div></div>
        <div class="card"><div class="kpi">$ ${new Intl.NumberFormat('es-CO').format(ticketProm)}</div><div class="kpi-sub">Ticket promedio</div></div>
      `;
    }
    updateStatsSedeCharts({ ord, pagos });
    renderStatsSedeTables({ ord, pagos });
    renderRankingSedes();
  }
  function updateStatsSedeCharts(ctx) {
    const ord = ctx.ord;
    const pagos = ctx.pagos;
    const dias = {};
    pagos.forEach(p => { const d = new Date(p.fecha); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; dias[k] = (dias[k] || 0) + Number(p.monto || 0); });
    const pagosLabels = Object.keys(dias).sort();
    const pagosData = pagosLabels.map(k => dias[k]);
    const elPagos = document.getElementById('chartStatsSedePagosCanvas');
    if (elPagos && typeof Chart !== 'undefined') {
      if (!charts.statsSedePagos) charts.statsSedePagos = new Chart(elPagos, { type:'line', data:{ labels: pagosLabels, datasets:[{ label:'Ventas', data: pagosData, borderColor:'rgba(76,119,255,0.9)', backgroundColor:'rgba(76,119,255,0.25)', tension:0.35, fill:true }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
      else { charts.statsSedePagos.data.labels = pagosLabels; charts.statsSedePagos.data.datasets[0].data = pagosData; charts.statsSedePagos.update(); }
    }
    const estados = {};
    ord.forEach(o => { const s = String(getOrderState(o)).toUpperCase(); estados[s] = (estados[s] || 0) + 1; });
    const estLabels = Object.keys(estados);
    const estData = estLabels.map(k => estados[k]);
    const elEstados = document.getElementById('chartStatsSedeEstadosCanvas');
    if (elEstados && typeof Chart !== 'undefined') {
      if (!charts.statsSedeEstados) charts.statsSedeEstados = new Chart(elEstados, { type:'bar', data:{ labels: estLabels, datasets:[{ label:'Órdenes', data: estData, backgroundColor:'rgba(34,209,238,0.6)', borderRadius:8 }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } } });
      else { charts.statsSedeEstados.data.labels = estLabels; charts.statsSedeEstados.data.datasets[0].data = estData; charts.statsSedeEstados.update(); }
    }
    const tipos = {};
    ord.forEach(o => { const t = (o.claseLentes || '').toLowerCase(); const k = t || 'sin_clase'; tipos[k] = (tipos[k] || 0) + 1; });
    const tiposLabels = Object.keys(tipos);
    const tiposData = tiposLabels.map(k => tipos[k]);
    const elTipos = document.getElementById('chartStatsSedeTiposCanvas');
    if (elTipos && typeof Chart !== 'undefined') {
      if (!charts.statsSedeTipos) charts.statsSedeTipos = new Chart(elTipos, { type:'bar', data:{ labels: tiposLabels, datasets:[{ label:'Unidades', data: tiposData, backgroundColor:'rgba(99,102,241,0.6)', borderRadius:8 }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } } });
      else { charts.statsSedeTipos.data.labels = tiposLabels; charts.statsSedeTipos.data.datasets[0].data = tiposData; charts.statsSedeTipos.update(); }
    }
    const mensual = {};
    ord.forEach(o => { const d = new Date(getOrderDateTs(o)); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; mensual[k] = (mensual[k] || 0) + 1; });
    const menLabels = Object.keys(mensual).sort();
    const menData = menLabels.map(k => mensual[k]);
    const elMensual = document.getElementById('chartStatsSedeMensualCanvas');
    if (elMensual && typeof Chart !== 'undefined') {
      if (!charts.statsSedeMensual) charts.statsSedeMensual = new Chart(elMensual, { type:'bar', data:{ labels: menLabels, datasets:[{ label:'Órdenes', data: menData, backgroundColor:'rgba(245,158,11,0.6)', borderRadius:8 }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } } });
      else { charts.statsSedeMensual.data.labels = menLabels; charts.statsSedeMensual.data.datasets[0].data = menData; charts.statsSedeMensual.update(); }
    }
    const ventasMensual = {};
    ord.forEach(o => { const d = new Date(getOrderDateTs(o)); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; ventasMensual[k] = (ventasMensual[k] || 0) + Number(o.precioVenta || 0); });
    const varLabels = Object.keys(ventasMensual).sort();
    const varData = varLabels.map(k => ventasMensual[k]);
    const elVar = document.getElementById('chartStatsSedeVariacionCanvas');
    if (elVar && typeof Chart !== 'undefined') {
      if (!charts.statsSedeVariacion) charts.statsSedeVariacion = new Chart(elVar, { type:'line', data:{ labels: varLabels, datasets:[{ label:'Ventas', data: varData, borderColor:'rgba(34,209,238,0.9)', backgroundColor:'rgba(34,209,238,0.25)', tension:0.35, fill:true }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
      else { charts.statsSedeVariacion.data.labels = varLabels; charts.statsSedeVariacion.data.datasets[0].data = varData; charts.statsSedeVariacion.update(); }
    }
    const productos = {};
    ord.forEach(o => { const t = (o.tipoLenteFiltros || '').trim().toLowerCase(); if (!t) return; productos[t] = (productos[t] || 0) + 1; });
    const prodPairs = Object.entries(productos).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const prodLabels = prodPairs.map(p=>p[0]);
    const prodData = prodPairs.map(p=>p[1]);
    const elTop = document.getElementById('chartStatsSedeTopProductosCanvas');
    if (elTop && typeof Chart !== 'undefined') {
      if (!charts.statsSedeTop) charts.statsSedeTop = new Chart(elTop, { type:'bar', data:{ labels: prodLabels, datasets:[{ label:'Unidades', data: prodData, backgroundColor:'rgba(59,130,246,0.6)', borderRadius:8 }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, indexAxis:'y', scales:{ x:{ beginAtZero:true, ticks:{ precision:0 } } } } });
      else { charts.statsSedeTop.data.labels = prodLabels; charts.statsSedeTop.data.datasets[0].data = prodData; charts.statsSedeTop.update(); }
    }
    const year = new Date().getFullYear();
    const anualLabels = Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
    const anualData = anualLabels.map(k => ord.filter(o => { const d = new Date(getOrderDateTs(o)); const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return m===k; }).reduce((s,o)=>s+Number(o.precioVenta||0),0));
    const elAnual = document.getElementById('chartStatsSedeAnualCanvas');
    if (elAnual && typeof Chart !== 'undefined') {
      if (!charts.statsSedeAnual) charts.statsSedeAnual = new Chart(elAnual, { type:'line', data:{ labels: anualLabels, datasets:[{ label:'Ventas', data: anualData, borderColor:'rgba(99,102,241,0.9)', backgroundColor:'rgba(99,102,241,0.25)', tension:0.35, fill:true }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
      else { charts.statsSedeAnual.data.labels = anualLabels; charts.statsSedeAnual.data.datasets[0].data = anualData; charts.statsSedeAnual.update(); }
    }
    const costoVsVentaLabels = ['Venta','Costo'];
    const costoVsVentaData = [ ord.reduce((s,o)=>s+Number(o.precioVenta||0),0), ord.reduce((s,o)=>s+Number(o.precioCosto||0),0) ];
    const elCV = document.getElementById('chartStatsSedeCostoVsVentaCanvas');
    if (elCV && typeof Chart !== 'undefined') {
      if (!charts.statsSedeCV) charts.statsSedeCV = new Chart(elCV, { type:'bar', data:{ labels: costoVsVentaLabels, datasets:[{ label:'$ COP', data: costoVsVentaData, backgroundColor:['rgba(34,209,238,0.6)','rgba(255,107,107,0.6)'], borderRadius:8 }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
      else { charts.statsSedeCV.data.labels = costoVsVentaLabels; charts.statsSedeCV.data.datasets[0].data = costoVsVentaData; charts.statsSedeCV.update(); }
    }
  }
  function renderStatsSedeTables(ctx) {
    const pagos = ctx.pagos;
    const ord = ctx.ord;
    const tabPagos = document.getElementById('tablaStatsSedePagos');
    if (tabPagos) {
      tabPagos.innerHTML = '';
      const head = document.createElement('div'); head.className='table-row table-head'; head.style.gridTemplateColumns='1fr 1fr 1fr 1fr'; head.innerHTML='<div>Orden</div><div>Monto</div><div>Fecha</div><div>Comprobante</div>'; tabPagos.appendChild(head);
      if (pagos.length===0) { const empty = document.createElement('div'); empty.className='empty'; empty.textContent='Sin pagos'; tabPagos.appendChild(empty); }
      else {
        pagos.forEach(p => { const row = document.createElement('div'); row.className='table-row'; row.style.gridTemplateColumns='1fr 1fr 1fr 1fr'; row.innerHTML=`<div>#${p.ordenId}</div><div>$ ${Number(p.monto||0).toFixed(2)}</div><div>${fechaCorta(p.fecha)}</div><div>${p.comprobante||''}</div>`; tabPagos.appendChild(row); });
      }
    }
    const tabOrd = document.getElementById('tablaStatsSedeOrdenes');
    if (tabOrd) {
      tabOrd.innerHTML='';
      const head = document.createElement('div'); head.className='table-row table-head'; head.style.gridTemplateColumns='1fr 2fr 1fr 1fr 1fr'; head.innerHTML='<div>ID</div><div>Paciente</div><div>Venta</div><div>Costo</div><div>Margen</div>'; tabOrd.appendChild(head);
      if (ord.length===0) { const empty = document.createElement('div'); empty.className='empty'; empty.textContent='Sin órdenes'; tabOrd.appendChild(empty); }
      else {
        ord.forEach(o => { const m = Number(o.precioVenta||0) - Number(o.precioCosto||0); const row = document.createElement('div'); row.className='table-row'; row.style.gridTemplateColumns='1fr 2fr 1fr 1fr 1fr'; row.innerHTML=`<div>#${o.number||o.id}</div><div>${getOrderPatientDisplay(o)}</div><div>$ ${Number(o.precioVenta||0).toFixed(2)}</div><div>$ ${Number(o.precioCosto||0).toFixed(2)}</div><div>$ ${m.toFixed(2)}</div>`; tabOrd.appendChild(row); });
      }
    }
  }
  // ---------- Órdenes por Sede (assistant/admin) ----------
  function setupOrdenesSede() {
    const sel = document.getElementById('filtroSedeOrdenes');
    const btn = document.getElementById('btnFiltrarSedeOrdenes');
    const resumen = document.getElementById('resumenSedeOrdenes');
    const lista = document.getElementById('listaOrdenesSede');
    if (sel) {
      sel.innerHTML = '<option value="">Selecciona una sede...</option>';
      (Array.isArray(data.sedes) ? data.sedes : []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = String(s.id);
        opt.textContent = s.name || s.nombre || `Sede ${s.id}`;
        sel.appendChild(opt);
      });
      const role = getRole();
      let saved = role === 'assistant' ? localStorage.getItem('assistant_headquarter_id') : null;
      if (role === 'assistant' && !saved) {
        const authUser = localStorage.getItem('auth_username') || sessionStorage.getItem('auth_username') || '';
        if (authUser && Array.isArray(data.usuarios)) {
          const u = data.usuarios.find(x => (x.email === authUser) || (x.name === authUser));
          if (u && u.headquarterId) {
            saved = String(u.headquarterId);
            localStorage.setItem('assistant_headquarter_id', saved);
          }
        }
      }
      if (role === 'assistant' && saved && Array.from(sel.options).some(o => o.value === saved)) sel.value = saved;
    }
    const render = () => {
      const role = getRole();
      const sedeId = sel?.value || '';
      if (role === 'assistant' && sel && sedeId) localStorage.setItem('assistant_headquarter_id', sedeId);
      const ordAll = Array.isArray(data.ordenes) ? data.ordenes : [];
      const ordFil = ordAll.filter(o => !sedeId || String(getOrderHeadquarterId(o))===String(sedeId));
      const totalOrdenes = ordFil.length;
      const totalVenta = ordFil.reduce((s,o)=>s+Number(o.precioVenta||0),0);
      if (resumen) {
        resumen.innerHTML = `
          <div class="card"><div class="kpi">${totalOrdenes}</div><div class="kpi-sub">Órdenes</div></div>
          <div class="card"><div class="kpi">$ ${new Intl.NumberFormat('es-CO').format(totalVenta)}</div><div class="kpi-sub">Ventas</div></div>
        `;
      }
      if (lista) {
        renderOrderTable(lista, ordFil);
      }
    };
    if (btn) btn.addEventListener('click', (e)=>{ e.preventDefault(); render(); });
    if (sel) sel.addEventListener('change', render);
    render();
  }
  function renderRankingSedes() {
    const tab = document.getElementById('tablaStatsRankingSedes');
    if (!tab) return;
    const sedesArr = Array.isArray(data.sedes) ? data.sedes : [];
    const ordArr = Array.isArray(data.ordenes) ? data.ordenes : [];
    const agreg = sedesArr.map(s => {
      const sid = String(s.id);
      const ventas = ordArr.filter(o => String(getOrderHeadquarterId(o))===sid).reduce((sum, o) => sum + Number(o.precioVenta||0), 0);
      const count = ordArr.filter(o => String(getOrderHeadquarterId(o))===sid).length;
      return { sede: s.name || s.nombre || `Sede ${s.id}`, ventas, count };
    }).sort((a,b)=>b.ventas-a.ventas);
    tab.innerHTML='';
    const head = document.createElement('div'); head.className='table-row table-head'; head.style.gridTemplateColumns='2fr 1fr 1fr'; head.innerHTML='<div>Sede</div><div>Ventas</div><div>Órdenes</div>'; tab.appendChild(head);
    if (agreg.length===0) { const empty = document.createElement('div'); empty.className='empty'; empty.textContent='No hay sedes'; tab.appendChild(empty); return; }
    agreg.forEach(r => { const row = document.createElement('div'); row.className='table-row'; row.style.gridTemplateColumns='2fr 1fr 1fr'; row.innerHTML=`<div>${r.sede}</div><div>$ ${new Intl.NumberFormat('es-CO').format(r.ventas)}</div><div>${r.count}</div>`; tab.appendChild(row); });
  }
  // ---------- Navegación y Eventos ----------
  // Asegurar que activateSection y syncFromHash se definen antes de usarse en listeners

  // ---------- Navegación por hash (secciones) ----------
  function activateSection(name) {
    const panels = Array.from(main.querySelectorAll('.panel'));
    const target = main.querySelector(`.panel[data-section="${name}"]`);
    if (!target) {
      // Fallback: mostrar resumen si no existe el panel solicitado
      const fallback = main.querySelector('.panel[data-section="resumen"]');
      panels.forEach(p => p.hidden = (p !== fallback));
      // Actualiza menú activo
      setActiveMenuItem('resumen');
      return;
    }
    // Respeto de roles: si el panel no es permitido, usar fallback
    const role = getRole();
    if (!isAllowedForRole(target, role)) {
      const fallback = main.querySelector('.panel[data-section="resumen"]');
      panels.forEach(p => p.hidden = (p !== fallback));
      setActiveMenuItem('resumen');
      if (location.hash !== '#resumen') location.hash = '#resumen';
      return;
    }
    panels.forEach(p => p.hidden = (p !== target));
    setActiveMenuItem(name);
  }

  function setActiveMenuItem(sectionName) {
    document.querySelectorAll('.menu .menu-item').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-section') === sectionName);
    });
  }

  function syncFromHash() {
    const hash = (location.hash || '#resumen').replace('#', '');
    activateSection(hash);
    if (hash === 'pendientes') try { renderPendientes(); } catch {}
  }

  function ensureSectionAllowed() {
    const hash = (location.hash || '#resumen').replace('#', '');
    const target = main.querySelector(`.panel[data-section="${hash}"]`);
    const role = getRole();
    if (target && !isAllowedForRole(target, role)) {
      activateSection('resumen');
      if (location.hash !== '#resumen') location.hash = '#resumen';
    }
    // Ocultar items de menú no permitidos
    document.querySelectorAll('.menu .menu-item').forEach(a => {
      a.toggleAttribute('hidden', !isAllowedForRole(a, role));
    });
  }
  
  document.querySelector('.menu').addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (!item) return;
    const href = item.getAttribute('href') || '';
    const isExternal = /patients\.html/i.test(href) && !/dashboard\.html/i.test(href);
    if (isExternal) return;
    e.preventDefault();
    const section = item.getAttribute('data-section') || 'resumen';
    if (section) {
      if (location.hash !== `#${section}`) location.hash = `#${section}`;
      activateSection(section);
    }
  });

  // ---------- Inicialización Segura ----------
  try { updateKPIsAndChart(); } catch (e) { console.error('KPI init error', e); }
  try { refreshProveedorOptions(); } catch (e) { console.error('Prov init error', e); }
  try { renderOrdenes(); } catch (e) { console.error('Ordenes init error', e); }
  try { setupPanelTabs('ordenes'); } catch {}
  try { renderPagos(); } catch {}
  try { setupPanelTabsPagos(); } catch {}
  try { setupReportes(); } catch {}
  try { setupStatsSede(); } catch {}
  try { setupOrdenesSede(); } catch {}
  try { renderProveedores(); } catch {}
  try { setupPanelTabs('proveedores'); } catch {}
  try { setupPanelTabs('usuarios'); } catch {}
  try { setupPanelTabs('sedes'); } catch {}
  try { renderNotificaciones(); } catch {}
  try { setupPanelTabs('notificaciones'); } catch {}

  window.addEventListener('hashchange', syncFromHash);
  try { syncFromHash(); } catch (e) { console.error('Nav init error', e); }
  
  // Señal: inicialización terminada
  window.__appInitDone = true;
})();
