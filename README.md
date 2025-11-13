# Opticas-Dr-mej-a

Proyecto estático con HTML/CSS/JS para la interfaz de la óptica.

Estructura principal:
- `index.html` - página principal
- `dashboard.html` - panel
- `patients.html` - gestión de pacientes
- `assets/` - CSS y JS

Arrancar el proyecto (necesita Node.js y npm):

1. Instalar dependencias (solo la primera vez):

```powershell
npm install
```

2. Iniciar servidor de desarrollo (abre el navegador):

```powershell
npm start
```

El servidor utiliza `lite-server` y sirve el directorio del proyecto. Si quieres que use un puerto distinto o cambie la baseDir, edita `bs-config.json` o el `package.json`.

Notas:
- Para producción solo sirve los archivos estáticos.
- Ejecuta `npm audit` para revisar vulnerabilidades detectadas por npm.
