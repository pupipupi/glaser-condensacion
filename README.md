# Condensación intersticial — Método Glaser - Gremio de Bioconstrucción Chile :)

Calculadora interactiva de condensación intersticial en muros multicapa (método Glaser, ISO 13788).

## Publicar en GitHub Pages (gratis, con link para cualquiera)

1. Creá un repositorio nuevo en GitHub (público), por ejemplo `glaser-condensacion`.
2. Subí **todo el contenido de esta carpeta** al repo (incluida la carpeta `.github/`, que suele estar oculta — asegurate que se suba igual).
   - Con GitHub Desktop: arrastrá la carpeta, hacé commit, "Publish repository".
   - Con git por línea de comandos:
     ```
     git init
     git add .
     git commit -m "primera version"
     git branch -M main
     git remote add origin https://github.com/TU-USUARIO/glaser-condensacion.git
     git push -u origin main
     ```
3. En GitHub, andá a **Settings → Pages**.
4. En "Build and deployment" → **Source**, elegí **GitHub Actions** (no "Deploy from a branch").
5. Esperá 1-2 minutos. El workflow (`.github/workflows/deploy.yml`, ya incluido) compila y publica solo cada vez que hagas push a `main`.
6. Tu link va a quedar en:
   `https://TU-USUARIO.github.io/glaser-condensacion/`

Ese link lo abre cualquier persona desde el navegador (celular o PC), sin instalar nada.

## Editar y probar en tu computador antes de subir

```
npm install
npm run dev
```

Abre en `http://localhost:5173`. Cualquier cambio en `src/GlaserCalculator.jsx` se refleja al instante.

## Actualizar el sitio ya publicado

Cada vez que quieras cambiar algo: editá `src/GlaserCalculator.jsx`, y luego:
```
git add .
git commit -m "ajuste"
git push
```
GitHub Actions vuelve a compilar y publicar automáticamente.
