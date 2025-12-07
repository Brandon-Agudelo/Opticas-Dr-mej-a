// Helper de API para centralizar fetchs al backend
(function () {
  // Configurable: define la URL base del backend una vez.
  // Puedes sobrescribir `window.API_BASE_URL` antes de cargar este archivo.
  // Ejemplo: <script>window.API_BASE_URL = 'http://localhost:3000/api';</script>
  const DEFAULT_BASE = 'http://localhost:8080/api';
  const BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) || DEFAULT_BASE;

  function getToken() {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  }

  // Une base y ruta de forma segura, evitando barras duplicadas y doble "/api"
  function joinUrl(base, path) {
    const baseNorm = String(base || '').replace(/\/+$/,'');
    let pathNorm = String(path || '');
    // Asegurar que la ruta comience con '/'
    if (!pathNorm.startsWith('/')) pathNorm = '/' + pathNorm;
    // Si la base ya termina en '/api' y la ruta comienza con '/api/', evita duplicar
    if (baseNorm.endsWith('/api') && /^\/api(\/|$)/.test(pathNorm)) {
      pathNorm = pathNorm.replace(/^\/api/, '');
      if (!pathNorm.startsWith('/')) pathNorm = '/' + pathNorm;
    }
    return baseNorm + pathNorm;
  }

  async function request(path, options = {}) {
    const url = joinUrl(BASE_URL, path);
    const headers = options.headers || {};
    const token = getToken();
    const merged = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };
    try {
      const res = await fetch(url, merged);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return res.json();
      return res.text();
    } catch (err) {
      console.warn('[API] request falló', url, err);
      throw err;
    }
  }

  const Api = {
    baseURL: BASE_URL,
    isEnabled() { return !!BASE_URL && (typeof window === 'undefined' || window.API_ENABLED !== false); },
    async get(path) { return request(path, { method: 'GET' }); },
    async post(path, body) { return request(path, { method: 'POST', body }); },
    async put(path, body) { return request(path, { method: 'PUT', body }); },
    async patch(path, body) { return request(path, { method: 'PATCH', body }); },
    async del(path) { return request(path, { method: 'DELETE' }); },
  };

  if (typeof window !== 'undefined') {
    window.Api = Api;
  }
})();

