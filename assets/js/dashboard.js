
// Interacciones básicas del dashboard (navegación entre secciones)
(function () {
  const main = document.getElementById('main');
  if (!main) return;

  // Forzar seed de datos con query param ?seed=1
  try {
    const url = new URL(window.location.href);
    const forceSeed = url.searchParams.get('seed') === '1';
    if (forceSeed) {
      try { localStorage.removeItem('optica_data'); } catch {}
    }
  } catch (_) {}

  // ---------- Store ----------
  const Store = {
    load() {
      try { return JSON.parse(localStorage.getItem('optica_data')) || { proveedores: [], ordenes: [], pagos: [], notificaciones: [], pacientes: [] }; } catch { return { proveedores: [], ordenes: [], pagos: [], notificaciones: [], pacientes: [] }; }
    },
    save(data) { localStorage.setItem('optica_data', JSON.stringify(data)); },
  };
  let data = Store.load();

  // Seed de datos demo si está todo vacío
  function isEmptyData(d) {
    return ['proveedores','ordenes','pagos','notificaciones','pacientes']
      .every(k => Array.isArray(d[k]) && d[k].length === 0);
  }
  if (isEmptyData(data)) {
    const now = Date.now();
    const proveedores = [
      { id: 1001, nombre: 'LentesPro', contacto: 'ventas@lentespro.com', notas: 'Entrega en 48h' },
      { id: 1002, nombre: 'OptiGlass', contacto: 'info@optiglass.com', notas: 'Antireflejo premium' },
      { id: 1003, nombre: 'VisionMax', contacto: 'contacto@visionmax.com', notas: 'Polarizado y fotocromático' },
      { id: 1004, nombre: 'CristalesPro', contacto: 'soporte@cristalespro.com', notas: 'Garantía 1 año' },
      { id: 1005, nombre: 'UltraOptics', contacto: 'ventas@ultraoptics.com', notas: 'Descuento por volumen' },
    ];
    const pacientes = [
      { id: 5001, nombre: 'Juan Pérez', contacto: 'juan@example.com', notas: '' },
      { id: 5002, nombre: 'María López', contacto: 'maria@example.com', notas: '' },
      { id: 5003, nombre: 'Carlos Díaz', contacto: 'carlos@example.com', notas: 'Usa lentes desde 2018' },
      { id: 5004, nombre: 'Ana Torres', contacto: 'ana@example.com', notas: 'AR recomendado' },
      { id: 5005, nombre: 'Luis Gómez', contacto: 'luis@example.com', notas: 'Fotocromático' },
      { id: 5006, nombre: 'Paola Ruiz', contacto: 'paola@example.com', notas: '' },
      { id: 5007, nombre: 'Sofía Herrera', contacto: 'sofia@example.com', notas: '' },
      { id: 5008, nombre: 'Miguel Castro', contacto: 'miguel@example.com', notas: 'Altas dioptrías' },
    ];
    const ordenes = [
      { id: 2001, paciente: 'Juan Pérez', proveedorId: 1001, formulaOD: '-2.00', formulaOI: '-1.75', notas: 'AR', estado: 'enviada', pagada: false },
      { id: 2002, paciente: 'María López', proveedorId: 1002, formulaOD: '-0.50', formulaOI: '-0.75', notas: '', estado: 'devuelta', pagada: false },
      { id: 2003, paciente: 'Carlos Díaz', proveedorId: 1001, formulaOD: '-1.00', formulaOI: '-1.25', notas: '', estado: 'completada', pagada: true },
      { id: 2004, paciente: 'Ana Torres', proveedorId: 1003, formulaOD: '-1.50', formulaOI: '-1.25', notas: 'Filtro azul', estado: 'en_proceso', pagada: false },
      { id: 2005, paciente: 'Luis Gómez', proveedorId: 1004, formulaOD: '-3.00', formulaOI: '-2.75', notas: 'Fotocromático', estado: 'pendiente', pagada: false },
      { id: 2006, paciente: 'Paola Ruiz', proveedorId: 1002, formulaOD: '-0.25', formulaOI: '-0.50', notas: '', estado: 'enviada', pagada: false },
      { id: 2007, paciente: 'Sofía Herrera', proveedorId: 1005, formulaOD: '-2.25', formulaOI: '-2.00', notas: 'AR premium', estado: 'en_proceso', pagada: false },
      { id: 2008, paciente: 'Miguel Castro', proveedorId: 1003, formulaOD: '-4.00', formulaOI: '-3.75', notas: 'Alta graduación', estado: 'completada', pagada: true },
      { id: 2009, paciente: 'Juan Pérez', proveedorId: 1001, formulaOD: '-2.25', formulaOI: '-2.00', notas: 'Repetición con ajuste', estado: 'devuelta', pagada: false },
      { id: 2010, paciente: 'Ana Torres', proveedorId: 1004, formulaOD: '-1.25', formulaOI: '-1.00', notas: 'Polarizado', estado: 'enviada', pagada: false },
    ];
    const pagos = [
      { id: 3001, ordenId: 2003, monto: 120.00, comprobante: null, fecha: now - 86_400_000 },
      { id: 3002, ordenId: 2008, monto: 180.00, comprobante: null, fecha: now - 172_800_000 },
      { id: 3003, ordenId: 2001, monto: 90.00, comprobante: null, fecha: now - 10_800_000 },
    ];
    const notificaciones = [
      { id: 4001, para: 'assistant', mensaje: 'Órdenes iniciales cargadas', fecha: now - 7_200_000 },
      { id: 4002, para: 'provider', mensaje: 'Orden #2001 asignada a LentesPro', fecha: now - 3_600_000 },
      { id: 4003, para: 'assistant', mensaje: 'Orden #2003 marcada como pagada', fecha: now - 3_000_000 },
      { id: 4004, para: 'assistant', mensaje: 'Proveedor "VisionMax" agregado al catálogo', fecha: now - 2_000_000 },
    ];
    data = { proveedores, ordenes, pagos, notificaciones, pacientes };
    Store.save(data);
  }

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
    // Ocultar/mostrar elementos por roles
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowed = el.getAttribute('data-roles').split(',').map(s => s.trim());
      el.toggleAttribute('hidden', !allowed.includes(role));
    });
    // Si la sección actual no es permitida, redirige a resumen
    ensureSectionAllowed();
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

  // Inicializar datos demo desde la UI
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      try { localStorage.removeItem('optica_data'); } catch {}
      // Recargar para re-ejecutar el seed si está vacío
      location.reload();
    });
  }

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
  applySidebarCollapsed(savedCollapsed);
  if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => applySidebarCollapsed(!appLayout.classList.contains('collapsed')));
  if (scrim) scrim.addEventListener('click', () => applySidebarCollapsed(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && scrim && scrim.classList.contains('visible')) applySidebarCollapsed(true); });
  window.addEventListener('resize', () => {
    const collapsed = appLayout?.classList.contains('collapsed');
    applySidebarCollapsed(!!collapsed);
  });

  // ---------- KPIs y gráfico ----------
  function updateKPIsAndChart() {
    const kEnviadas = document.getElementById('kpiOrdenesEnviadas');
    const kPendientes = document.getElementById('kpiPendientes');
    const kPagosPend = document.getElementById('kpiPagosPendientes');
    if (kEnviadas) kEnviadas.textContent = String(data.ordenes.length);
    if (kPendientes) kPendientes.textContent = String(data.ordenes.filter(o => o.estado !== 'devuelta' && o.estado !== 'completada').length);
    if (kPagosPend) kPagosPend.textContent = String(data.ordenes.filter(o => !o.pagada).length);
    updateCharts();
  }

  // ---------- Charts (Chart.js) ----------
  const charts = { estados: null, pagos: null, reportPagos: null, reportEstados: null };
  window.charts = charts;
  function updateCharts() {
    // Estados de órdenes (bar)
    const estadosEl = document.getElementById('chartEstadosCanvas');
    if (estadosEl && typeof Chart !== 'undefined') {
      const labels = ['enviada','devuelta','completada'];
      const counts = labels.map(e => data.ordenes.filter(o => o.estado === e).length);
      if (!charts.estados) {
        charts.estados = new Chart(estadosEl, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Órdenes',
              data: counts,
              backgroundColor: [ 'rgba(76,119,255,0.6)', 'rgba(255,107,107,0.6)', 'rgba(34,209,238,0.6)' ],
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

  function fechaCorta(ts) {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  function refreshOrdenOptionsForPagos() {
    if (!pagoOrdenSelect) return;
    pagoOrdenSelect.innerHTML = '';
    // Prioriza órdenes no pagadas
    const pendientes = data.ordenes.filter(o => !o.pagada);
    const arr = pendientes.length ? pendientes : data.ordenes;
    arr.forEach(o => {
      const opt = document.createElement('option');
      opt.value = String(o.id);
      opt.textContent = `#${o.id} · ${o.paciente} · ${providerNameById(o.proveedorId)}`;
      pagoOrdenSelect.appendChild(opt);
    });
  }

  function renderPagos() {
    if (!listaPagos) return;
    listaPagos.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.style.gridTemplateColumns = '1fr 1fr 1fr auto';
    head.innerHTML = '<div>Orden</div><div>Monto</div><div>Fecha</div><div>Acciones</div>';
    listaPagos.appendChild(head);
    if (!data.pagos || data.pagos.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay pagos registrados. Usa "Registrar pago" para añadir uno.';
      listaPagos.appendChild(empty);
    } else {
      data.pagos.forEach((p, idx) => {
        const row = document.createElement('div'); row.className = 'table-row'; row.style.gridTemplateColumns = '1fr 1fr 1fr auto';
        row.innerHTML = `<div>#${p.ordenId}</div><div>$${Number(p.monto).toFixed(2)}</div><div>${fechaCorta(p.fecha)}</div><div><button class="btn-outline" data-idx="${idx}">Eliminar</button></div>`;
        row.querySelector('button').addEventListener('click', () => {
          const ordenId = data.pagos[idx].ordenId;
          // Revertir pagada en la orden asociada
          const ordIdx = data.ordenes.findIndex(o => o.id === ordenId);
          if (ordIdx >= 0) data.ordenes[ordIdx].pagada = false;
          data.pagos.splice(idx, 1);
          Store.save(data);
          renderPagos(); updateKPIsAndChart(); updateCharts();
        });
        listaPagos.appendChild(row);
      });
    }
  }

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
  if (formPago) formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    const ordenId = pagoOrdenSelect.value;
    const monto = Number(pagoMontoInput.value);
    markField('pagoOrden', !!ordenId, 'Debes seleccionar una orden');
    markField('pagoMonto', monto > 0, 'Monto debe ser mayor que 0');
    if (!ordenId || !(monto > 0)) return;
    const pago = {
      id: Date.now(),
      ordenId: Number(ordenId),
      monto,
      comprobante: (pagoComprobanteInput.value || '').trim() || null,
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
  const cancelOrden = document.getElementById('cancelOrden');
  const ordPacienteInput = document.getElementById('ordPaciente');
  const ordProveedorSelect = document.getElementById('ordProveedor');
  const ordFormulaODInput = document.getElementById('ordFormulaOD');
  const ordFormulaOIInput = document.getElementById('ordFormulaOI');
  const ordNotasInput = document.getElementById('ordNotas');

  function providerNameById(id) {
    const p = data.proveedores.find(x => String(x.id) === String(id));
    return p ? p.nombre : '(sin proveedor)';
  }

  function refreshProveedorOptions() {
    if (!ordProveedorSelect) return;
    ordProveedorSelect.innerHTML = '';
    data.proveedores.forEach(p => {
      const opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = p.nombre;
      ordProveedorSelect.appendChild(opt);
    });
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
        <div><div style="color:var(--c-text-light);font-size:13px;">Cliente</div><div>${o.paciente}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(o.proveedorId)}</div></div>
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
        <div><div style="color:var(--c-text-light);font-size:13px;">Cliente</div><div>${o.paciente}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(o.proveedorId)}</div></div>
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
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <h3 style="margin:0;">Detalles de la orden</h3>
          <div style="color:var(--c-text-light);font-size:13px;">Información completa de la orden de trabajo</div>
        </div>
        <button class="btn-outline" id="closeOrdenModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div><div style="color:var(--c-text-light);font-size:13px;">Número de orden</div><div>#${o.id}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Cliente</div><div>${o.paciente}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(o.proveedorId)}</div></div>
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
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <h3 style="margin:0;">Detalles de la orden</h3>
          <div style="color:var(--c-text-light);font-size:13px;">Información completa de la orden de trabajo</div>
        </div>
        <button class="btn-outline" id="closeOrdenModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div><div style="color:var(--c-text-light);font-size:13px;">Número de orden</div><div>#${o.id}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Cliente</div><div>${o.paciente}</div></div>
        <div><div style="color:var(--c-text-light);font-size:13px;">Proveedor</div><div>${providerNameById(o.proveedorId)}</div></div>
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

  function renderOrdenes() {
    if (!listaOrdenes) return;
    // Cargar proveedores en select
    const provSelect = document.getElementById('filtroOrdenProveedor');
    if (provSelect && provSelect.children.length <= 1) {
      data.proveedores.forEach(p => {
        const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.nombre;
        provSelect.appendChild(opt);
      });
    }
    // Leer filtros
    const paciente = document.getElementById('filtroOrdenPaciente')?.value.trim().toLowerCase() || '';
    const proveedorId = document.getElementById('filtroOrdenProveedor')?.value || '';
    const estado = document.getElementById('filtroOrdenEstado')?.value || '';
    const fecha = document.getElementById('filtroOrdenFecha')?.value || '';
    // Filtrar
    let ordenes = data.ordenes.filter(o => {
      if (paciente && !o.paciente.toLowerCase().includes(paciente)) return false;
      if (proveedorId && o.proveedorId != proveedorId) return false;
      if (estado && o.estado !== estado) return false;
      if (fecha) {
        const orderDate = new Date(o.fecha || 0).toISOString().slice(0,10);
        if (orderDate !== fecha) return false;
      }
      return true;
    });

    listaOrdenes.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.style.gridTemplateColumns = '1fr 1fr 1fr 1fr auto';
    head.innerHTML = '<div>Paciente</div><div>Proveedor</div><div>Estado</div><div>Pagada</div><div>Acciones</div>';
    listaOrdenes.appendChild(head);
    if (ordenes.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay órdenes con esos filtros.';
      listaOrdenes.appendChild(empty);
    } else {
      ordenes.forEach((o, idx) => {
        const row = document.createElement('div'); row.className = 'table-row'; row.style.gridTemplateColumns = '1fr 1fr 1fr 1fr auto';
        row.innerHTML = `<div>${o.paciente}</div><div>${providerNameById(o.proveedorId)}</div><div>${o.estado}</div><div>${o.pagada ? 'Sí' : 'No'}</div><div><button class="btn-outline" data-action="view" data-idx="${idx}" title="Ver detalles"><iconify-icon icon="ph:eye"></iconify-icon></button> <button class="btn-outline" data-action="pay" data-idx="${idx}">${o.pagada ? 'Pagada' : 'Marcar pagada'}</button> <button class="btn-outline" data-action="del" data-idx="${idx}">Eliminar</button></div>`;
        const viewBtn = row.querySelector('button[data-action="view"]');
        const payBtn = row.querySelector('button[data-action="pay"]');
        const delBtn = row.querySelector('button[data-action="del"]');
        if (viewBtn) viewBtn.addEventListener('click', () => { openOrdenDetails(o); });
        if (payBtn) payBtn.addEventListener('click', () => {
          if (o.pagada) return;
          data.ordenes[idx].pagada = true;
          try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Orden #${o.id} marcada como pagada`, fecha: Date.now() }); } catch {}
          Store.save(data); renderOrdenes(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
        });
        if (delBtn) delBtn.addEventListener('click', () => {
          data.ordenes.splice(idx, 1);
          try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Orden #${o.id} eliminada`, fecha: Date.now() }); } catch {}
          Store.save(data); renderOrdenes(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
        });
        listaOrdenes.appendChild(row);
      });
    }
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
  function toggleOrdenForm(show) { if (ordPanel) activateTab(ordPanel, show ? '#formOrden' : '#listaOrdenes'); }
  function setOrdenTabPersist(show) { localStorage.setItem('tab_ordenes', show ? '#formOrden' : '#listaOrdenes'); }
  if (btnNuevaOrden) btnNuevaOrden.addEventListener('click', () => { toggleOrdenForm(true); setOrdenTabPersist(true); });
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
  if (cancelOrden) cancelOrden.addEventListener('click', () => { toggleOrdenForm(false); setOrdenTabPersist(false); });
  if (formOrden) formOrden.addEventListener('submit', (e) => {
    e.preventDefault();
    const paciente = ordPacienteInput.value.trim();
    const proveedorId = ordProveedorSelect.value;
    markField('ordPaciente', !!paciente, 'El paciente es obligatorio');
    markField('ordProveedor', !!proveedorId, 'Debes seleccionar un proveedor');
    if (!paciente || !proveedorId) return;
    const orden = {
      id: Date.now(),
      paciente,
      proveedorId: Number(proveedorId),
      formulaOD: (ordFormulaODInput.value || '').trim(),
      formulaOI: (ordFormulaOIInput.value || '').trim(),
      notas: (ordNotasInput.value || '').trim(),
      estado: 'enviada',
      pagada: false,
    };
    data.ordenes.push(orden);
    try { data.notificaciones.push({ id: Date.now(), para: 'provider', mensaje: `Orden #${orden.id} asignada a ${providerNameById(orden.proveedorId)}`, fecha: Date.now() }); } catch {}
    Store.save(data);
    toggleOrdenForm(false);
    formOrden.reset();
    renderOrdenes(); updateKPIsAndChart(); updateCharts(); try { renderNotificaciones(); } catch {}
  });

  function markField(id, ok, msg) {
    const el = document.getElementById(id);
    const field = el?.closest('.field');
    const hint = document.getElementById(id + 'Hint');
    if (!field) return;
    field.classList.toggle('invalid', !ok);
    if (hint) hint.textContent = ok ? '' : (msg || 'Campo inválido');
  }
  // ---------- Proveedores ----------
  const listaProveedores = document.getElementById('listaProveedores');
  const formProveedor = document.getElementById('formProveedor');
  const btnNuevoProveedor = document.getElementById('btnNuevoProveedor');
  const cancelProveedor = document.getElementById('cancelProveedor');
  const provNombreInput = document.getElementById('provNombre');

  function renderProveedores() {
    if (!listaProveedores) return;
    // Leer filtros
    const nombre = document.getElementById('filtroProvNombre')?.value.trim().toLowerCase() || '';
    const contacto = document.getElementById('filtroProvContacto')?.value.trim().toLowerCase() || '';
    // Filtrar
    let proveedores = data.proveedores.filter(p => {
      if (nombre && !p.nombre.toLowerCase().includes(nombre)) return false;
      if (contacto && !(p.contacto || '').toLowerCase().includes(contacto)) return false;
      return true;
    });

    listaProveedores.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.innerHTML = '<div>Nombre</div><div>Contacto</div><div>Notas</div><div>Acciones</div>';
    listaProveedores.appendChild(head);
    if (proveedores.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay proveedores con esos filtros.';
      listaProveedores.appendChild(empty);
    } else {
      proveedores.forEach((p, idx) => {
        const row = document.createElement('div'); row.className = 'table-row';
        row.innerHTML = `<div>${p.nombre}</div><div>${p.contacto || ''}</div><div>${p.notas || ''}</div><div><button class="btn-outline" data-idx="${idx}">Eliminar</button></div>`;
        row.querySelector('button').addEventListener('click', () => {
          const nombreEliminado = p.nombre;
          data.proveedores.splice(idx, 1);
          try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Proveedor \"${nombreEliminado}\" eliminado`, fecha: Date.now() }); } catch {}
          Store.save(data); renderProveedores(); updateKPIsAndChart();
          // Actualiza selects dependientes en Órdenes y Reportes
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
  if (btnNuevoProveedor) btnNuevoProveedor.addEventListener('click', () => { toggleProveedorForm(true); setProveedorTabPersist(true); });
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
  if (formProveedor) formProveedor.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = provNombreInput.value.trim();
    markField('provNombre', !!nombre, 'El nombre es obligatorio');
    if (!nombre) return;
    const proveedor = { id: Date.now(), nombre, contacto: document.getElementById('provContacto').value.trim(), notas: document.getElementById('provNotas').value.trim() };
    data.proveedores.push(proveedor);
    try { data.notificaciones.push({ id: Date.now(), para: 'assistant', mensaje: `Proveedor \"${nombre}\" registrado`, fecha: Date.now() }); } catch {}
    Store.save(data);
    // Actualiza selects dependientes en Órdenes y Reportes
    try { refreshProveedorOptions(); } catch {}
    try { refreshProveedorOptionsReportes(); } catch {}
    toggleProveedorForm(false);
    formProveedor.reset();
    renderProveedores(); updateKPIsAndChart(); try { renderNotificaciones(); } catch {}
  });

  // ---------- Notificaciones ----------
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
        row.innerHTML = `<div>${fechaCorta(n.fecha)}</div><div>${n.para}</div><div>${n.mensaje}</div><div><button class="btn-outline" data-idx="${idx}">Eliminar</button></div>`;
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

  function markField(id, ok, msg) {
    const el = document.getElementById(id);
    const field = el?.closest('.field');
    const hint = document.getElementById(id + 'Hint');
    if (!field) return;
    field.classList.toggle('invalid', !ok);
    if (hint) hint.textContent = ok ? '' : (msg || 'Campo inválido');
  }

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
    const initialTarget = initialSaved && targets.includes(initialSaved)
      ? initialSaved
      : (panel.querySelector('.tabs .tab.active') || tabs[0])?.getAttribute('data-target');
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
      opt.textContent = p.nombre;
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

  function buildCSV(rows) {
    const escape = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return rows.map(r => r.map(escape).join(',')).join('\n');
  }
  function downloadCSV(filename, rows) {
    const blob = new Blob([buildCSV(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
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
      const ts = (o.fecha || o.createdAt || o.id || Date.now());
      const row = document.createElement('div'); row.className = 'table-row'; row.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 1fr';
      row.innerHTML = `<div>#${o.id}</div><div>${o.paciente}</div><div>${providerNameById(o.proveedorId)}</div><div>${o.estado}</div><div>${o.pagada ? 'Sí' : 'No'}</div><div>${fechaCorta(ts)}</div>`;
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
      const ts = (o.fecha || o.createdAt || o.id || Date.now());
      return inRange(ts, fromTs, toTs) && (!provId || o.proveedorId === provId);
    });

    const totalPagos = pagosFiltrados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const ordenesPagadas = ordenesFiltradas.filter(o => o.pagada).length;
    const ordenesNoPagadas = ordenesFiltradas.filter(o => !o.pagada).length;
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
      downloadCSV('pagos_reporte.csv', rows);
    };
    const btnOrd = document.getElementById('exportOrdenesCSV');
    if (btnOrd) btnOrd.onclick = () => {
      const rows = [ ['ID','Paciente','Proveedor','Estado','Pagada','Fecha'], ...ordenesFiltradas.map(o => { const ts = (o.fecha || o.createdAt || o.id || Date.now()); return [ `#${o.id}`, o.paciente, providerNameById(o.proveedorId), o.estado, o.pagada ? 'Sí' : 'No', fechaCorta(ts) ]; }) ];
      downloadCSV('ordenes_reporte.csv', rows);
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
      const labels = ['enviada','devuelta','completada'];
      const counts = labels.map(e => ordenesFiltradas.filter(o => o.estado === e).length);
      if (!charts.reportEstados) {
        charts.reportEstados = new Chart(repEstadosEl, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Órdenes', data: counts, backgroundColor: [ 'rgba(34,209,238,0.6)', 'rgba(255,107,107,0.6)', 'rgba(76,119,255,0.6)' ], borderRadius: 8 }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
      } else {
        charts.reportEstados.data.datasets[0].data = counts;
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
  }
  // ---------- Inicialización ----------
  updateKPIsAndChart();
  refreshProveedorOptions();
  renderOrdenes();
  setupPanelTabs('ordenes');
  renderPagos();
  setupPanelTabsPagos();
  setupReportes();
  renderProveedores();
  setupPanelTabs('proveedores');
  renderNotificaciones();
  setupPanelTabs('notificaciones');

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

  // ---------- Render Pendientes ----------
  function renderPendientes() {
    const filtro = document.getElementById('pendientesFiltro').value;
    const host = document.getElementById('listaPendientes');
    if (!host) return;
    let ordenes = data.ordenes.filter(o => ['pendiente','enviada','en_proceso'].includes(o.estado));
    if (filtro === 'sin_pagar') {
      ordenes = ordenes.filter(o => !o.pagada);
    }
    if (ordenes.length === 0) {
      host.innerHTML = '<div class="empty">No hay órdenes pendientes</div>';
      return;
    }
    const rows = ordenes.map(o => {
      const prov = data.proveedores.find(p => p.id === o.proveedorId) || {};
      const pagoBadge = o.pagada
        ? '<span class="badge badge-success">Pagada</span>'
        : '<span class="badge badge-warning">Pendiente pago</span>';
      return `<tr>
        <td>${o.id}</td>
        <td>${o.paciente}</td>
        <td>${prov.nombre || '-'}</td>
        <td><span class="badge">${o.estado}</span></td>
        <td>${pagoBadge}</td>
        <td>${new Date(o.fecha || Date.now()).toLocaleDateString()}</td>
        <td>
          ${!o.pagada ? `<button class="btn-outline btn-sm marcar-pagado" data-id="${o.id}">Marcar pagado</button>` : ''}
        </td>
      </tr>`;
    }).join('');
    host.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th># Orden</th>
            <th>Paciente</th>
            <th>Proveedor</th>
            <th>Estado</th>
            <th>Pago</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    // Delegación para botones marcar pagado
    host.addEventListener('click', e => {
      if (e.target.classList.contains('marcar-pagado')) {
        const ordenId = parseInt(e.target.dataset.id, 10);
        marcarOrdenPagada(ordenId);
      }
    });
  }

  function marcarOrdenPagada(ordenId) {
    const orden = data.ordenes.find(o => o.id === ordenId);
    if (!orden) return;
    orden.pagada = true;
    // Añadir registro de pago
    const pagoId = (data.pagos.length ? Math.max(...data.pagos.map(p => p.id)) : 3000) + 1;
    data.pagos.push({
      id: pagoId,
      ordenId: ordenId,
      monto: 0, // se puede editar luego en el panel Pagos
      comprobante: 'Pagado desde pendientes',
      fecha: Date.now()
    });
    Store.save(data);
    renderPendientes();
    // Refrescar KPIs
    updateKPIs();
  }

  // Conectar filtro
  const pendientesFiltro = document.getElementById('pendientesFiltro');
  if (pendientesFiltro) {
    pendientesFiltro.addEventListener('change', renderPendientes);
  }

  // Llamar a renderPendientes cuando se active la sección
  const originalSyncFromHash = syncFromHash;
  syncFromHash = function() {
    originalSyncFromHash();
    if (window.location.hash === '#pendientes') {
      renderPendientes();
    }
  };
  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();

  // Señal: inicialización terminada
  window.__appInitDone = true;
})();
