# Deploy en Railway - Instrucciones

## Pasos para subir a Railway:

### 1. Preparar GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit - Sistema de Quinielas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Configurar Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detectará automáticamente que es PHP

### 3. Configurar Variables de Entorno
En Railway Dashboard → Variables:
```
RAPIDAPI_KEY=tu_api_key_aqui
```

### 4. ¡Listo!
- Railway generará una URL como: `https://tu-app.up.railway.app`
- La aplicación estará disponible en minutos
- SQLite funcionará temporalmente sin problemas

## Archivos agregados para Railway:
- `composer.json` - Configuración PHP
- `railway.json` - Configuración de deploy
- `.env.example` - Variables de entorno ejemplo
- Modificaciones en `api/matches.php` para variables de entorno
- Modificaciones en `config/database.php` para paths de Railway

## Notas importantes:
- La base de datos SQLite persiste durante el uso normal
- Solo se resetea en nuevos deploys
- Perfecto para uso temporal de 5 días