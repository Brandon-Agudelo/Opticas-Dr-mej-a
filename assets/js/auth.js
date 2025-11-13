
(function () {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const emailInput = document.getElementById('email');
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
      const email = emailInput.value;
      const password = passwordInput.value;
      const role = roleInput.value;
      const remember = rememberInput.checked;

      // Basic validation
      if (!email || !password || !role) {
        errorMsg.textContent = 'Por favor, completa todos los campos.';
        errorMsg.hidden = false;
        return;
      }

      // Simulate authentication
      const token = `fake_token_${Date.now()}`;
      if (remember) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_role', role);
      } else {
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_role', role);
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
})();
