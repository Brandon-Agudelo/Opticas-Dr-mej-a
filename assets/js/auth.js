
(function () {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const roleInput = document.getElementById('role');
  const rememberInput = document.getElementById('remember');
  const errorMsg = document.getElementById('errorMsg');

  // ---------- Modo demo (auto-autenticación) ----------
  try {
    const url = new URL(window.location.href);
    const isDemo = url.searchParams.get('demo') === '1';
    if (isDemo) {
      const demoTokenExists = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!demoTokenExists) {
        const token = `fake_token_${Date.now()}`;
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_role', 'assistant');
      }
    }
  } catch (_) {
    // Ignorar errores de URL en entornos no estándar
  }

  // ---------- Check authentication status ----------
  const isAuthenticated = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated() && !window.location.pathname.endsWith('index.html')) {
    window.location.href = 'index.html';
  }

  // Si ya estás autenticado y estás en el login, redirige al dashboard
  if (isAuthenticated() && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
    window.location.href = 'dashboard.html#resumen';
  }

  // ---------- Login ----------
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value;
      const password = passwordInput.value;
      const role = roleInput.value;
      const remember = (rememberInput && rememberInput.checked) || false;

      // Basic validation
      if (!username || !password || !role) {
        errorMsg.textContent = 'Por favor, completa todos los campos.';
        errorMsg.hidden = false;
        return;
      }

      // Simulate authentication
      const token = `fake_token_${Date.now()}`;
      if (remember) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_role', role);
        localStorage.setItem('auth_username', username);
      } else {
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_role', role);
        sessionStorage.setItem('auth_username', username);
      }

      // Redirect to dashboard (sección Resumen)
      window.location.href = 'dashboard.html#resumen';
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
