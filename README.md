# 🥑 Dietapp

App de nutrición **cómoda y visual**: registra lo que comes por gramos o con medidas fáciles
("1 pechuga", "½ plato de arroz cocido"), y ve cómo se llenan tus barras de macros y
micronutrientes. Funciona en el navegador (PC) y se instala en Android como PWA. Todo se guarda
en tu dispositivo.

## Funciones

- **Objetivos personalizados**: Mifflin-St Jeor (o Katch-McArdle con % de grasa) × actividad ×
  objetivo (perder / mantener / ganar). Micronutrientes según EFSA.
- **Diario** por comidas con anillo de calorías, barras de macros y **24 micronutrientes** que
  al completarse se convierten en checks ✓ en la sección "Completado hoy" (incluido el yodo). Límites de azúcar,
  saturadas y sodio.
- **Medidas fáciles crudo/cocinado** ("¼ plato en crudo (60 g)" / "½ plato cocido (150 g)").
- **Base de alimentos**: 285 alimentos habituales en español (medidas caseras, alérgenos, yodo)
  + 7.793 de USDA SR Legacy + 3.178 de CIQUAL 2020, todo en local y offline.
- **Intolerancias**: los alimentos que coinciden se marcan en rojo en toda la app.
- **Recetas**: guarda tu cena de siempre y añádela en un toque; ese día puedes quitar las nueces
  o poner más brócoli sin tocar la receta.
- **Dietas**: genera una semana según lo que quieras cocinar (fácil / media / elaborada) y la
  variedad (poca / media / mucha). Botón **Sustituir** en cada ingrediente, cambia platos enteros,
  guarda varias dietas y activa la de la semana.
- **Lista de la compra** semanal o mensual, en crudo, agrupada por sección, con unidades
  ("6 huevos", "3 plátanos"), casillas y compartir.
- Agua, registro de peso con gráfica, tema claro/oscuro, exportar/importar datos.

## Arrancar

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>. Para probar en el móvil en la misma wifi: `npm run dev -- --host`
y abre la IP que muestra.

En el PC del desarrollador basta con doble clic en `Dietapp.cmd` (o el acceso directo del Escritorio):
arranca la versión compilada en <http://localhost:4173> y abre el navegador.

## Publicar

La app vive en **<https://dusthandler.github.io/Dietapp/>**. Cada `git push` a `main` la reconstruye y
publica sola (GitHub Actions → GitHub Pages, ver `.github/workflows/deploy.yml`). La versión antigua
queda en la rama `legacy`.

- La ruta base se controla con `VITE_BASE` (`/Dietapp/` en Pages; `/` en local o con dominio propio).
- Para servirla en un subdominio propio (p. ej. `dietapp.dusthandler.com`): añadir un registro DNS
  `CNAME dietapp → dusthandler.github.io`, poner el dominio en Settings → Pages del repo y cambiar
  `VITE_BASE` a `/` en el workflow.

## Instalar en Android

1. Abre <https://dusthandler.github.io/Dietapp/> en Chrome.
2. Menú ⋮ → **Instalar aplicación** (o el banner "Añadir a pantalla de inicio").
3. Funciona offline: la base de alimentos se cachea en la primera carga. Se actualiza sola cuando
   hay versión nueva.

## Documentación

- [docs/GUIA-DESARROLLO.md](docs/GUIA-DESARROLLO.md): arquitectura, modelo de datos, fórmulas,
  cómo ampliar alimentos/recetas y el **roadmap de nube, nutricionistas y chat**.

## Fuentes

- Composición de alimentos: USDA FoodData Central, SR Legacy (abril 2018), dominio público;
  CIQUAL 2020 (ANSES, Francia), Licence Ouverte / Etalab 2.0.
- Valores de referencia: EFSA Dietary Reference Values.
- Ecuaciones: Mifflin-St Jeor (1990), Katch-McArdle, ISSN position stand on protein (2017).

Dietapp no sustituye el consejo de un profesional sanitario.
