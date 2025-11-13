(function () {
  const main = document.getElementById('main');
  if (!main) return;

  // ---------- Store ----------
  const Store = {
    load() {
      try { return JSON.parse(localStorage.getItem('optica_data')) || { proveedores: [], ordenes: [], pagos: [], notificaciones: [], pacientes: [] }; } catch { return { proveedores: [], ordenes: [], pagos: [], notificaciones: [], pacientes: [] }; }
    },
    save(data) { localStorage.setItem('optica_data', JSON.stringify(data)); },
  };
  let data = Store.load();

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
  applySidebarCollapsed(savedCollapsed);
  if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => applySidebarCollapsed(!appLayout.classList.contains('collapsed')));
  if (scrim) scrim.addEventListener('click', () => applySidebarCollapsed(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && scrim && scrim.classList.contains('visible')) applySidebarCollapsed(true); });
  window.addEventListener('resize', () => {
    const collapsed = appLayout?.classList.contains('collapsed');
    applySidebarCollapsed(!!collapsed);
  });

  // ---------- Pacientes ----------
  const listaPacientes = document.getElementById('listaPacientes');
  const formPaciente = document.getElementById('formPaciente');
  const btnNuevoPaciente = document.getElementById('btnNuevoPaciente');
  const cancelPaciente = document.getElementById('cancelPaciente');
  const pacNombreInput = document.getElementById('pacNombre');
  function renderPacientes() {
    if (!listaPacientes) return;
    listaPacientes.innerHTML = '';
    const head = document.createElement('div'); head.className = 'table-row table-head'; head.innerHTML = '<div>Nombre</div><div>Contacto</div><div>Notas</div><div>Acciones</div>';
    listaPacientes.appendChild(head);
    if (!data.pacientes || data.pacientes.length === 0) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No hay pacientes. Usa "Registrar paciente" para añadir el primero.';
      listaPacientes.appendChild(empty);
    } else {
      data.pacientes.forEach((p, idx) => {
        const row = document.createElement('div'); row.className = 'table-row';
        row.innerHTML = `<div>${p.nombre}</div><div>${p.contacto || ''}</div><div>${p.notas || ''}</div><div><button class="btn-outline" data-idx="${idx}">Eliminar</button></div>`;
        row.querySelector('button').addEventListener('click', () => {
          data.pacientes.splice(idx, 1);
          Store.save(data); renderPacientes();
        });
        listaPacientes.appendChild(row);
      });
    }
  }
  const pacPanel = main.querySelector('[data-section="pacientes"]');
  function togglePacienteForm(show) { if (pacPanel) activateTab(pacPanel, show ? '#formPaciente' : '#listaPacientes'); }
  function setPacienteTabPersist(show) { localStorage.setItem('tab_pacientes', show ? '#formPaciente' : '#listaPacientes'); }
  if (btnNuevoPaciente) btnNuevoPaciente.addEventListener('click', () => { togglePacienteForm(true); setPacienteTabPersist(true); });
  if (cancelPaciente) cancelPaciente.addEventListener('click', () => { togglePacienteForm(false); setPacienteTabPersist(false); });
  if (formPaciente) formPaciente.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = pacNombreInput.value.trim();
    markField('pacNombre', !!nombre, 'El nombre es obligatorio');
    if (!nombre) return;
    const paciente = { id: Date.now(), nombre, contacto: document.getElementById('pacContacto').value.trim(), notas: document.getElementById('pacNotas').value.trim() };
    data.pacientes.push(paciente);
    Store.save(data);
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
  setupPanelTabs('pacientes');
})();