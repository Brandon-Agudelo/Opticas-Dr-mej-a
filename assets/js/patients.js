(async function () {
  const main = document.getElementById('main');
  if (!main) return;

  // ---------- Store ----------
  const Store = {
    load() {
      // Deshabilitar persistencia local: iniciar siempre vacío para operar contra backend
      return { proveedores: [], ordenes: [], pagos: [], notificaciones: [], pacientes: [] };
    },
    save(_) { /* no-op: la fuente de verdad es el backend */ },
  };
  // Función para detectar datos vacíos
  function isEmptyData(d) {
    return ['proveedores','ordenes','pagos','notificaciones','pacientes']
      .every(k => Array.isArray(d[k]) && d[k].length === 0);
  }
  let data = Store.load();

  // Intentar cargar datos desde backend si existe Api
  async function loadRemoteData() {
    try {
      if (!window.Api || !window.Api.isEnabled()) return null;
      const [proveedores, ordenes, pagos, pacientes] = await Promise.all([
        window.Api.get('/api/providers'),
        window.Api.get('/api/orders'),
        window.Api.get('/api/payments'),
        window.Api.get('/api/patients'),
      ]);
      return {
        proveedores: Array.isArray(proveedores) ? proveedores : [],
        ordenes: Array.isArray(ordenes) ? ordenes : [],
        pagos: Array.isArray(pagos) ? pagos : [],
        pacientes: Array.isArray(pacientes) ? pacientes : [],
        notificaciones: [],
      };
    } catch (_) { return null; }
  }
  try {
    const remote = await loadRemoteData();
    if (remote && !isEmptyData(remote)) {
      data = remote;
      Store.save(data);
    }
  } catch (_) {}

  // ---------- Role ----------
  const roleSelector = document.getElementById('roleSelector');
  function getRole() { return localStorage.getItem('auth_role') || sessionStorage.getItem('auth_role') || 'assistant'; }
  function isAllowedForRole(el, role) {
    if (!el) return false;
    const attr = el.getAttribute('data-roles');
    if (!attr) return true;
    const allowed = attr.split(',').map(s => s.trim());
    return allowed.includes(role);
  }
  function setRoleUI(role) {
    // Ocultar/mostrar elementos por roles
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowed = el.getAttribute('data-roles').split(',').map(s => s.trim());
      el.toggleAttribute('hidden', !allowed.includes(role));
    });
    // Oculta menú según rol
    document.querySelectorAll('.menu .menu-item').forEach(a => {
      const allowed = a.getAttribute('data-roles');
      if (!allowed) return;
      const arr = allowed.split(',').map(s => s.trim());
      a.toggleAttribute('hidden', !arr.includes(role));
    });
    // Si el panel pacientes no es permitido, redirige al dashboard
    const pacientesPanel = document.querySelector('.panel[data-section="pacientes"]');
    if (pacientesPanel && !isAllowedForRole(pacientesPanel, role)) {
      window.location.href = 'dashboard.html#resumen';
    }
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

  // ---------- Pacientes ----------
  const listaPacientes = document.getElementById('listaPacientes');
  const formPaciente = document.getElementById('formPaciente');
  const btnNuevoPaciente = document.getElementById('btnNuevoPaciente');
  const cancelPaciente = document.getElementById('cancelPaciente');
  const pacFilters = document.getElementById('pacFilters');
  const togglePacFiltersBtn = document.getElementById('togglePacFilters');
  const pacDocumentoInput = document.getElementById('pacDocumento');
  const pacNombreInput = document.getElementById('pacNombre');
  const pacEmailInput = document.getElementById('pacEmail');
  const pacDireccionInput = document.getElementById('pacDireccion');
  function renderPacientes() {
    if (!listaPacientes) return;
    // Leer filtros
    const nombre = document.getElementById('filtroPacNombre')?.value.trim().toLowerCase() || '';
    const contacto = document.getElementById('filtroPacContacto')?.value.trim().toLowerCase() || '';
    // Filtrar
    let pacientes = data.pacientes.filter(p => {
      const nm = (p.name || p.nombre || '').toLowerCase();
      const mail = (p.email || p.contacto || '').toLowerCase();
      if (nombre && !nm.includes(nombre)) return false;
      if (contacto && !mail.includes(contacto)) return false;
      return true;
    });

    listaPacientes.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.innerHTML = '<div>Documento</div><div>Nombre</div><div>Email</div><div>Dirección</div><div>Notas</div><div>Acciones</div>';
    listaPacientes.appendChild(head);
    if (pacientes.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay pacientes con esos filtros.';
      listaPacientes.appendChild(empty);
    } else {
      pacientes.forEach((p, idx) => {
        const row = document.createElement('div'); row.className = 'table-row';
        const accionesHtml = `<div class=\"acciones\"><button class=\"btn-outline btn-sm\" data-idx=\"${idx}\" title=\"Eliminar\"><iconify-icon icon=\"ph:trash\"></iconify-icon><span class=\"label\">Eliminar</span></button></div>`;
        row.innerHTML = `<div>${p.document || ''}</div><div>${p.name || p.nombre || ''}</div><div>${p.email || p.contacto || ''}</div><div>${p.address || p.direccion || ''}</div><div>${p.notes || p.notas || ''}</div>${accionesHtml}`;
        row.querySelector('button').addEventListener('click', async () => {
          // Eliminar en backend y refrescar listado
          try {
            const doc = p.document || p.id;
            if (doc && window.Api && window.Api.isEnabled()) {
              await window.Api.del(`/api/patients/${encodeURIComponent(doc)}`);
            }
          } catch (_) {}
          try {
            const remote = await loadRemoteData();
            if (remote) data = remote;
          } catch (_) {}
          renderPacientes();
        });
        listaPacientes.appendChild(row);
      });
    }
  }
  const pacPanel = main.querySelector('[data-section="pacientes"]');
  function togglePacienteForm(show) { if (pacPanel) activateTab(pacPanel, show ? '#formPaciente' : '#listaPacientes'); }
  function setPacienteTabPersist(show) { localStorage.setItem('tab_pacientes', show ? '#formPaciente' : '#listaPacientes'); }
  // Modal para Registrar Paciente
  const pacFormModalState = {};
  function openPacienteFormModal(triggerBtn) {
    if (!formPaciente) return;
    const id = 'formPaciente';
    pacFormModalState[id] = { parent: formPaciente.parentElement, next: formPaciente.nextElementSibling };
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.background = 'rgba(0,0,0,0.35)'; overlay.style.zIndex = '1000';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.position = 'fixed'; modal.style.top = '50%'; modal.style.left = '50%'; modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(700px, 94vw)'; modal.style.maxHeight = '85vh'; modal.style.overflow = 'auto'; modal.style.padding = '16px';
    modal.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <div><h3 style="margin:0;">Registrar paciente</h3><div style="color:var(--c-text-light);font-size:13px;">Complete los datos y guarde</div></div>
      <button class="btn-outline" id="closePacFormModal" title="Cerrar"><iconify-icon icon="ph:x"></iconify-icon></button>
    </div>`;
    const body = document.createElement('div');
    formPaciente.hidden = false;
    body.appendChild(formPaciente);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
      try {
        const st = pacFormModalState[id];
        if (st && st.parent) {
          formPaciente.hidden = true;
          if (st.next && st.next.parentElement === st.parent) st.parent.insertBefore(formPaciente, st.next);
          else st.parent.appendChild(formPaciente);
        }
        document.body.removeChild(overlay);
        if (triggerBtn) triggerBtn.setAttribute('aria-pressed', 'false');
      } catch {}
    }
    modal.querySelector('#closePacFormModal').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    // Cerrar al cancelar dentro del formulario
    if (cancelPaciente) {
      const onCancel = (e) => { e.preventDefault(); close(); };
      cancelPaciente.addEventListener('click', onCancel, { once: true });
    }
    // Cerrar al enviar (después de la lógica de guardado)
    formPaciente.addEventListener('submit', () => { setTimeout(close, 0); }, { once: true });
  }

  if (btnNuevoPaciente) btnNuevoPaciente.addEventListener('click', () => { openPacienteFormModal(btnNuevoPaciente); });

  // Modal genérico para filtros (alineado al dashboard)
  const filtersModalState = {};
  function openFiltersModal(containerEl, title, triggerBtn) {
    if (!containerEl) return;
    const id = containerEl.id || Math.random().toString(36).slice(2);
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
    applyBtn.addEventListener('click', () => { close(); renderPacientes(); });
    cancelBtn.addEventListener('click', close);
  }
  // Filtros pacientes
  ['filtroPacNombre','filtroPacContacto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderPacientes);
  });
  const limpiarPac = document.getElementById('limpiarFiltrosPac');
  if (limpiarPac) limpiarPac.addEventListener('click', () => {
    ['filtroPacNombre','filtroPacContacto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderPacientes();
  });
  // Botón de lupa para abrir filtros en modal
  if (togglePacFiltersBtn) togglePacFiltersBtn.addEventListener('click', () => openFiltersModal(pacFilters, 'Filtros de pacientes', togglePacFiltersBtn));
  // Cancelar registro (cuando no está en modal) mantiene comportamiento previo
  if (cancelPaciente) cancelPaciente.addEventListener('click', () => { togglePacienteForm(false); setPacienteTabPersist(false); });
  if (formPaciente) formPaciente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const documentVal = pacDocumentoInput.value.trim();
    const nombre = pacNombreInput.value.trim();
    const email = pacEmailInput.value.trim();
    const direccion = pacDireccionInput.value.trim();
    const notas = document.getElementById('pacNotas').value.trim();

    markField('pacDocumento', documentVal && documentVal.length >= 3, 'Documento mínimo 3 caracteres');
    markField('pacNombre', !!nombre, 'El nombre es obligatorio');
    markField('pacEmail', !!email && email.includes('@'), 'Email inválido');
    markField('pacDireccion', !!direccion, 'La dirección es obligatoria');
    if (!(documentVal && documentVal.length >= 3 && nombre && email.includes('@') && direccion)) return;

    try {
      if (window.Api && window.Api.isEnabled()) {
        const payload = { document: documentVal, name: nombre, email, address: direccion, notes: notas };
        await window.Api.post('/api/patients', payload);
      }
    } catch (_) {}

    // Refrescar desde backend y cerrar formulario
    try {
      const remote = await loadRemoteData();
      if (remote) data = remote;
    } catch (_) {}
    togglePacienteForm(false);
    formPaciente.reset();
    renderPacientes();
  });

  function markField(id, ok, msg) {
    const el = document.getElementById(id);
    const field = el?.closest('.field');
    const hint = document.getElementById(id + 'Hint');
    if (!field) return;
    field.classList.toggle('invalid', !ok);
    if (hint) hint.textContent = ok ? '' : (msg || 'Campo inválido');
  }

  function activateTab(panel, targetSel) {
    const tabs = panel.querySelectorAll('.tabs .tab');
    const targets = Array.from(tabs).map(t => t.getAttribute('data-target'));
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === targetSel));
    targets.forEach(sel => {
      const el = panel.querySelector(sel);
      if (el) el.hidden = (sel !== targetSel);
    });
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

  // ---------- Inicialización ----------
  renderPacientes();
  // Interceptar tab "Registrar" para abrir modal en vez de cambiar de pestaña
  const registrarTab = pacPanel?.querySelector('.tabs .tab[data-target="#formPaciente"]');
  if (registrarTab) registrarTab.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); openPacienteFormModal(registrarTab); });
  setupPanelTabs('pacientes');
})();
