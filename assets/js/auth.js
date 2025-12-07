
(function () {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const roleInput = document.getElementById('role');
  const rememberInput = document.getElementById('remember');
  const errorMsg = document.getElementById('errorMsg');

  // ---------- Check authentication status ----------
  const isAuthenticated = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  // Si ya estás autenticado y estás en el login, redirige al dashboard
  if (isAuthenticated() && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
    window.location.href = 'dashboard.html#resumen';
  }

  // ---------- Login (integrado con backend) ----------
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value?.trim();
      const password = passwordInput.value || '';
      const selectedRole = roleInput?.value || 'assistant';
      const remember = (rememberInput && rememberInput.checked) || false;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      // Validación básica
      if (!username || !password) {
        errorMsg.textContent = 'Por favor, completa usuario y contraseña.';
        errorMsg.hidden = false;
        return;
      }
      errorMsg.hidden = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Entrando…'; }

      // En modo offline, permitir acceso directo sin contactar backend
      try {
        const stor = remember ? localStorage : sessionStorage;
        const roleSimple = selectedRole || 'assistant';
        const token = `fake_token_${Date.now()}`;
        stor.setItem('auth_user', username || 'demo');
        stor.setItem('auth_username', username || 'demo');
        stor.setItem('auth_role', roleSimple);
        stor.setItem('auth_token', token);
        window.location.href = 'dashboard.html#resumen';
      } catch (error) {
        console.error('[auth] offline error: ', error);
        errorMsg.textContent = 'No se pudo iniciar sesión en modo offline';
        errorMsg.hidden = false;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar';
        }
      }
    });
  }

  // ---------- Logout ----------
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_role');
      window.location.href = 'index.html';
    });
  }

  // ---------- Toggle password visibility ----------
  const toggleBtn = document.querySelector('.toggle-password');
  if (passwordInput && toggleBtn) {
    const setState = (visible) => {
      passwordInput.type = visible ? 'text' : 'password';
      toggleBtn.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      toggleBtn.setAttribute('aria-pressed', String(visible));
      toggleBtn.dataset.visible = visible ? 'true' : 'false';
      passwordInput.focus();
    };
    // Estado inicial
    setState(false);
    toggleBtn.addEventListener('click', () => {
      const nowVisible = passwordInput.type === 'password';
      setState(nowVisible);
    });
  }

  // ---------- Sync inputbox has-value ----------
  function syncHasValue(input) {
    const parent = input.closest('.inputbox');
    if (!parent) return;
    if (input.value && input.value.length > 0) {
      parent.classList.add('has-value');
    } else {
      parent.classList.remove('has-value');
    }
  }
  if (usernameInput) {
    ['input', 'change', 'blur'].forEach((ev) => usernameInput.addEventListener(ev, () => syncHasValue(usernameInput)));
    syncHasValue(usernameInput);
  }
  if (passwordInput) {
    ['input', 'change', 'blur'].forEach((ev) => passwordInput.addEventListener(ev, () => syncHasValue(passwordInput)));
    syncHasValue(passwordInput);
  }
})();
