# Dietapp — Guía de desarrollo

> Objetivo: que la app funcione hoy 100 % en local (PWA) y que mañana pueda crecer a
> usuarios en la nube, nutricionistas, chat y planes asignados **sin reescribir** la UI.

---

## 1. Stack y por qué

| Capa | Elección | Motivo |
|---|---|---|
| UI | React 18 + TypeScript + Vite 6 | Rápido, tipado, ecosistema enorme. |
| Estilos | Tailwind CSS v4 + tokens CSS (`src/index.css`) | Tema claro/oscuro con variables; todo el color pasa por tokens. |
| Animación | Framer Motion | Springs, `layoutId` (las barras → círculos de check), sheets arrastrables. |
| Datos locales | Dexie (IndexedDB) + `dexie-react-hooks` | Reactivo (`useLiveQuery`), soporta MB de datos, ideal para sync después. |
| PWA | `vite-plugin-pwa` (Workbox) | Instalable en Android/escritorio, funciona offline (incluida la base de alimentos). |
| Iconos | lucide-react | Consistentes y ligeros. |
| Base de alimentos | USDA FoodData Central **SR Legacy** (dominio público) + **CIQUAL 2020** (ANSES, Licence Ouverte) | 7.793 + 3.178 alimentos, ~35 nutrientes por 100 g. CIQUAL aporta yodo y los pescados/embutidos/platos mediterráneos que faltan en USDA. |

Comandos:

```bash
npm install          # dependencias
npm run dev          # http://localhost:5173
npm run build        # dist/ (PWA lista para servir)
npm run preview      # prueba la build
npm run typecheck    # tsc
npm run build:foods  # regenera public/data/usda.json y ciqual.json a partir de los ficheros oficiales
npm run build:icons  # regenera los PNG del manifest desde public/icons/icon.svg
```

---

## 1b. Arranque provisional en el PC del usuario

`Dietapp.cmd` (raíz del proyecto; acceso directo "Dietapp" en el Escritorio con el icono de la app):
comprueba si http://localhost:4173 responde; si no, compila si falta `dist/` y arranca
`npx vite preview --port 4173 --host --strictPort` minimizado (ventana "Dietapp - servidor"); luego abre
la URL en el navegador por defecto. Cerrar esa ventana apaga la app. Tras cambiar código hay que volver a
`npm run build` (el servidor sirve `dist/`). Cuando exista la nube, esto desaparece.

## 2. Estructura

```
src/
  data/
    nutrients.ts      # claves, etiquetas, unidades, agrupación (macro/vitamina/mineral/límite)
    foods.es.ts       # capa en español: ~285 alimentos habituales → NDB USDA / código CIQUAL, emoji, medidas caseras, alérgenos, rendimiento, unidad de compra
    foods.ciqual.ts   # enlaces CIQUAL: alimentos sin equivalente USDA y fuente de yodo para cada alimento español
    foodDb.ts         # catálogo en memoria: carga usda.json + ciqual.json, fusiona curados + bases + personalizados, búsqueda con puntuación
    mealTemplates.ts  # ~50 plantillas de platos para el generador de dietas
    types.ts          # modelo de dominio (Profile, DiaryEntry, Recipe, Plan, …)
    db.ts             # esquema Dexie (IndexedDB)
  lib/
    nutrition.ts      # BMR/TDEE/objetivos/valores de referencia EFSA
    planGenerator.ts  # generador semanal, re-barajar comida, sustituciones equivalentes
    dates.ts, theme.ts
  store/
    repo.ts           # ÚNICA capa que escribe en IndexedDB (repositorio)
    hooks.ts          # hooks reactivos de lectura + cálculos (resumen del día, conflictos con intolerancias)
  components/ui.tsx   # Button, Chip, Sheet, Ring, ProgressBar, Stepper, Toast, useConfirm…
  features/
    onboarding/  today/  foods/  recipes/  plans/  shopping/  profile/
scripts/
  build-usda.mjs      # USDA JSON → public/data/usda.json (compacto, 1,9 MB / 600 KB gzip)
  build-ciqual.mjs    # CIQUAL XML → public/data/ciqual.json (790 KB / 170 KB gzip)
  build-icons.mjs
public/data/*.json    # bases de alimentos (se cachean offline por el service worker)
```

**Regla de oro:** la UI nunca toca Dexie directamente. Lee con hooks de `store/hooks.ts`
y escribe con funciones de `store/repo.ts`. Cuando llegue la nube, se cambia el
repositorio (o se añade un motor de sync) y la UI no se entera.

---

## 3. Modelo de datos (preparado para la nube)

Toda entidad persistida extiende `BaseEntity`:

```ts
{ id: uuid, userId: 'local' | <uid>, createdAt, updatedAt, deletedAt?: number | null }
```

- `id` es UUID generado en cliente → no hay colisiones al sincronizar.
- `updatedAt` permite **last-write-wins** por registro.
- `deletedAt` = borrado lógico → los borrados también se sincronizan.
- `userId` = `'local'` hasta que exista login; al iniciar sesión se reasigna a la cuenta (migración de datos locales → nube).

Tablas: `profile`, `diary` (una fila por alimento; `groupId` agrupa recetas), `recipes`, `plans`
(7 días × comidas × ingredientes), `customFoods`, `usage` (recientes/favoritos/última ración), `extras`
(agua, peso), `settings`.

Los alimentos se referencian por id estable:
- `es:<slug>` capa española (p. ej. `es:pechuga-pollo`)
- `usda:<ndb>` base USDA
- `ciqual:<código>` base CIQUAL
- `custom:<uuid>` creados por el usuario

Cada referencia (`FoodRef`) guarda `grams`, `state` (`raw`/`cooked`) y `portionLabel`
("2 filetes cocinados"). Así el diario siempre puede recalcularse aunque cambien
las tablas nutricionales.

---

## 4. Cálculo nutricional

`lib/nutrition.ts`:

- **BMR**: Mifflin-St Jeor (1990). Es la ecuación con mejor precisión validada en población
  general (Academy of Nutrition and Dietetics). Si el usuario aporta % de grasa corporal se usa
  **Katch-McArdle** (masa magra), más precisa en personas muy musculadas u obesas.
- **Etnia**: no existe hoy una ecuación con ajuste étnico validada que supere a Mifflin de
  forma consistente (hay ligeras sobreestimaciones ~3-5 % en población asiática). La forma
  fiable de corregir ese sesgo es el % de grasa (Katch-McArdle). Si en el futuro se quiere,
  se puede añadir un campo `ethnicity` y un factor de corrección en `computeTargets`.
- **TDEE** = BMR × factor de actividad (1,2 – 1,9).
- **Objetivo**: perder = −250/−500/−750 kcal según ritmo (suelo: nunca < BMR ni < 1200/1500);
  ganar = +150/+300/+450 (superávit conservador).
- **Macros**: proteína 1,6–2,0 g/kg según objetivo (ISSN 2017), grasa ≥ 0,7 g/kg (~28 % kcal),
  el resto carbohidratos. Se pueden sobrescribir a mano (`profile.overrides`).
- **Micronutrientes**: valores de referencia **EFSA DRV** por sexo/edad; B1 y B3 dependen de la
  energía. Límites: sodio 2 g, azúcares < 10 % kcal, saturadas < 10 % kcal.
- **Yodo**: USDA SR Legacy no lo publica. Cada alimento de la capa española tiene un equivalente
  CIQUAL en `foods.ciqual.ts` (`IODINE_FROM`) del que se toma el yodo; si solo hay código crudo, el
  cocinado se estima por concentración (crudo ÷ rendimiento). Los alimentos USDA sueltos (búsqueda
  internacional) aportan 0 de yodo → el total real puede ser algo mayor.

`store/hooks.ts` calcula el resumen del día (`useDaySummary`) sumando `nutrientsFor(food, state) × grams/100`.

---

## 5. Base de alimentos

- `scripts/build-usda.mjs` convierte el JSON oficial (210 MB) en `public/data/usda.json`
  (1,9 MB; 600 KB gzip). `scripts/build-ciqual.mjs` convierte los XML de CIQUAL 2020 en
  `public/data/ciqual.json` (790 KB). Ambos con el **mismo orden de nutrientes** (`NUTRIENT_KEYS`),
  `null` = sin dato. Todos los valores por 100 g.
- Un alimento español puede apoyarse en USDA (`ndb`/`ndbCooked`) o en CIQUAL (`ciq`/`ciqCooked`
  o `CIQUAL_PRIMARY`). Merluza, dorada, jamón serrano, kéfir, gazpacho, tortilla de patatas,
  sal yodada… vienen de CIQUAL.
- `foods.es.ts` es la capa "humana": nombre en español, emoji, **medidas caseras** separadas
  en crudo/cocinado (`state`), factor `yield` (peso cocinado ÷ crudo) para la lista de la compra,
  alérgenos UE y `unit` de compra ("6 huevos", "3 plátanos").
- Búsqueda: `catalog.search()` normaliza acentos, puntúa coincidencia al inicio de palabra,
  prioriza español > personalizados > USDA/CIQUAL. Las bases internacionales (inglés/francés) se
  activan con búsquedas de > 3 letras o con el botón "Buscar también en las bases internacionales".

Para añadir un alimento español nuevo: localizar su NDB en `usda.json` o su código en `ciqual.json`
(buscando la descripción en inglés), añadir la entrada en `CURATED_FOODS` y su fuente de yodo en
`IODINE_FROM`.

Alternativa futura: **BEDCA** (base española) requiere aceptar licencia y no es redistribuible
libremente; **Open Food Facts** (productos envasados, ODbL) es una buena segunda fuente para
escanear códigos de barras (ver §9).

---

### 5.x Alimentos propios y ajustes por marca

Sección "Alimentos" (`features/foods/FoodsPage.tsx`, ruta `/alimentos`): buscar en todo el catálogo,
crear alimentos propios y **ajustar cualquier alimento existente a la marca que compra el usuario**.
- Un ajuste es un `CustomFood` con `overrideOf: <id base>` (p. ej. `es:pollo-pechuga`). `catalog.setCustom`
  guarda el original en `originals` y sustituye el alimento en el mapa con `applyOverride` (mismo id, así
  diario, recetas y dietas usan los valores nuevos sin tocar nada). Si el base tiene variante cocinada,
  se recalcula manteniendo la relación crudo→cocinado de cada nutriente. `Food.overridden = true` y
  `catalog.original(id)` devuelve el original; borrar el registro restablece.
- `CustomFoodEditor` sirve para crear, editar propios y ajustar: los campos numéricos son texto libre
  (admiten coma y punto: antes eran `parseFloat` sobre un input controlado y se comían el decimal), la sal
  se introduce en g y se guarda como sodio (×400), y las vitaminas/minerales van en un bloque plegable.
  En un ajuste, cada campo distinto del original muestra "original: x".
- En la nube, los ajustes viajan con el usuario (tabla `customFoods`) y un nutricionista podría
  proponer los suyos; los alimentos base nunca se modifican.

## 6. Generador de dietas y sustituciones

`lib/planGenerator.ts`:

1. Reparto de kcal por comida según 3/4/5 comidas.
2. Filtra plantillas por complejidad (fácil ⊂ media ⊂ elaborada), intolerancias y "no me gusta".
3. Variedad: `low` = 1 plato por franja toda la semana; `medium` = 3 rotando; `high` = 7.
4. `instantiateTemplate` escala los ingredientes (excepto `fixed`: aceite, especias) para cuadrar
   las kcal de esa comida y ajusta la fuente de proteína al objetivo proporcional de la comida
   compensando kcal con la fuente de carbohidrato. Después `balanceDay` corrige el día completo:
   grasa (reduce aguacate/frutos secos/quesos si sobra) → proteína (±15 %) → kcal (carbohidratos).
   **Alimentos base** (`params.mustHave`, "lo que tengo en la nevera"): las plantillas que ya los
   contienen van primero en cada franja y `injectMustHave` garantiza que aparezcan en los días
   programados (`mustHaveSchedule`: ~3 días repartidos; con poca variedad, todos) sustituyendo el
   ingrediente del mismo rol que da nombre al plato (misma energía) o añadiéndolos como extra.
   Antes del balance, `boostMicros` añade hasta 4 "refuerzos" (kiwi, almendras, sardinas, sal
   yodada…) a un snack cuando un micronutriente queda < 90 % del objetivo (máx. +320 kcal, que
   luego se descuentan de los carbohidratos). Cada ingrediente se mantiene entre el 50 % y el
   200 % de su tamaño en la plantilla.
   Resultado típico: kcal ±3 %, grasa ±10 g, proteína entre el objetivo y +20 %, 24-25/25 micros.
   Las cantidades se muestran siempre con la medida casera más cercana (`describeAmount`:
   "≈ 1 plátano mediano", "2 rebanadas", "≈ 1½ botes escurridos").
5. `substitutes()` propone alternativas con el **mismo rol** (`protein`, `carb`, `veg`…),
   ajustando gramos para igualar kcal y priorizando proteína parecida. `SubstituteSheet`
   (features/foods) se usa tanto en las dietas como en el diario de "Hoy".
6. `balanceExistingDay()` = botón **"Nivelar el día"**: tras editar a mano un día del plan, reajusta
   las cantidades (grasa → proteína → kcal) sin cambiar alimentos; los ingredientes < 15 g y
   especias/salsas no se tocan y ninguno baja del 50 % ni sube del doble.
7. Búsqueda por nutriente (`features/foods/NutrientFoods.tsx`): escribir "vitamina c", "hierro",
   "yodo"… en el buscador muestra los alimentos españoles ordenados por cantidad en una ración
   habitual y % del objetivo. Los micronutrientes pendientes de "Hoy" y del plan son clicables y
   abren la misma lista para añadir directamente.
   Los refuerzos de micros llevan `slots` (brócoli solo en comida/cena, etc.).
8. **Qué lo aporta hoy**: en "Hoy" todas las barras (macros, micros pendientes, límites) y los checks
   de completados son clicables y abren `NutrientFoodsSheet` con un panel "Hoy ya llevas" / "De dónde
   viene hoy" (`ContributorList`): los alimentos registrados ese día ordenados por aporte, con comida
   y % del total; tocar uno abre su editor de cantidad/sustituir. En escritorio el panel va a la
   derecha de la lista de alimentos ricos; en móvil, encima. Para los límites (sodio, saturadas,
   azúcares) solo se muestra el panel y el consejo para bajarlo. Con ratón, pasar por una barra
   muestra un popover (`HoverContribs`, top 5) pintado en un portal con posición fija para que la
   columna con scroll no lo recorte; en táctil no hay hover y se abre con un toque.
9. Buscador y nutrientes: `nutrientFromQuery` reconoce el nombre exacto ("vitamina c", "hierro"; nunca
   una sola letra ni "sal", que son principios de alimentos) y `nutrientSuggestions` ofrece chips
   cuando lo escrito es un prefijo ("vitamina" → todas las vitaminas, "vitamina b" → las B, "omeg").
   Al tocar un chip el picker fija `nutrientPick` y muestra la lista de alimentos ricos.
10. **Recalcular el resto del día** (`regenerateRest`, UI en `features/today/DayActions.tsx`): lo ya
    registrado entra como comidas fijas (`fixed: true`), se instancian plantillas nuevas para las comidas
    marcadas con las kcal/proteína restantes repartidas por `mealSplit`, `boostMicros` solo puede añadir
    refuerzos a las comidas nuevas (parámetro `editable`), `balanceDay` ajusta y un paso final escala en
    bloque los ingredientes libres de las comidas nuevas si el día sigue a más del 3 % del objetivo (una
    sola comida nueva puede no tener carbohidratos que ajustar). Mínimo por comida: 120 kcal snack /
    300 kcal principal, para que "compensar" nunca sea saltarse una comida. Por defecto se marcan las
    comidas vacías que aún no han pasado (hoy) y que existen en la dieta activa; se ve la propuesta y se
    puede pedir otra antes de aplicarla (`clearMeal` + `addItemsToDiary` por comida).
11. **Guardar el día como dieta** (`SaveDayAsPlanSheet`): `diaryAsPlanMeals` convierte el diario en
    `PlanMeal[]` (título = receta o alimento único) y se guarda un plan con los 7 días iguales
    (`variety: 'low'`), con opción de activarlo.

Para ampliar el recetario: añadir plantillas a `mealTemplates.ts` (los ids de alimentos son los
de `foods.es.ts`). Un nutricionista podrá crearlas desde la UI en la fase nube (§8).

---

## 7. Diseño / UX

- Tokens en `src/index.css` (`--accent`, `--ink`, `--surface`…) y utilidades Tailwind (`bg-accent`,
  `text-ink-2`). El modo oscuro se aplica con la clase `.dark` (auto/claro/oscuro en Perfil).
- Componentes base en `components/ui.tsx`. `Sheet` es bottom-sheet en móvil y modal en escritorio.
- Micro-interacciones: `haptic()` (vibración en Android), springs, `layoutId` para que una barra
  se convierta en su check al completarse, toasts.
- **Nada de animaciones de salida** (`AnimatePresence` + `exit`): en el equipo del usuario (Windows con
  "reducir movimiento") Framer Motion dejaba elementos "saliendo" montados para siempre — sheets
  invisibles que bloqueaban clics, tarjetas de micros completados que no desaparecían al cambiar de
  día. Regla: solo animaciones de entrada; los desmontajes son directos (`Sheet` usa un temporizador).
- `.press:active` escala solo 0.985: con 0.97 un botón ancho se encogía por debajo del cursor y el clic
  en su borde (p. ej. "ver") se perdía.
- "Hoy" en escritorio: las dos columnas son contenedores de scroll independientes; un listener `wheel`
  pasa el desplazamiento a la otra columna cuando la que está bajo el cursor llega al final.
- Campos numéricos: `NumberField`/`DateField` (`components/fields.tsx`) — escribibles y con −/+;
  nada de sliders para altura/peso.
- Selector de cantidad (`PortionEditor`): macros arriba con emoji, medidas con peso crudo y cocinado
  a la vez (vía `yield`), dos steppers sincronizados (editas uno y el otro se recalcula).
- Buscador (`FoodPicker`): fila de "habituales en esta comida" (índice `meal` del diario, 90 días) y
  mosaico de categorías (`CATEGORY_TILES` agrupa categorías de datos: Proteínas = carne+pescado+huevos…).
- Fotos de recetas: `lib/image.ts` reduce a 320 px WebP (~10-25 KB) y se guarda como data URL en
  `Recipe.image`; se muestra en la cabecera de la comida cuando el grupo viene de esa receta.
- "Hoy" en escritorio (≥ lg) va a dos columnas: comidas a la izquierda, datos (energía, agua, micros,
  límites) a la derecha en columna pegajosa.
- `NUTRIENT_NOTES` explica los micros que es normal no cubrir con comida (vit. D = sol, etc.).
- **Color de barras y anillo** = `barTone(valor, objetivo, kind)` en `data/nutrients.ts`, un gradiente
  continuo con `color-mix()` entre `--danger`, `--warn` y `--ok`. Objetivos (kcal, macros): rojo < 45 %,
  amarillo ~80 %, verde 92–110 %, amarillo hasta 125 %, rojo ≥ 150 %. Micros: igual pero nunca penaliza
  pasarse. Límites: verde < 60 %, amarillo 60–100 %, naranja 100–110 % (margen de tolerancia: un tope no
  es un precipicio) y rojo ≥ 110 %. Los umbrales viven solo ahí; `ToneLegend` en "Hoy" los explica.
  Antes las barras de micros iban por grupo (lila vitaminas, azul minerales); se quitó porque no aportaba.
- PWA: `registerSW` en `main.tsx` comprueba actualizaciones cada minuto (`r.update()`) y el SW es
  `autoUpdate`, así el usuario no se queda con un bundle antiguo en caché tras un despliegue.
- Nunca dejar al usuario pensar: la comida se preselecciona por la hora, el picker recuerda la
  última ración usada, "Recientes" y "Favoritos" primero, y las intolerancias se marcan en rojo
  en todas las listas.

---

## 8. Roadmap nube (mañana)

### 8.1 Backend recomendado

**Supabase** (Postgres + Auth + Realtime + Storage + Row Level Security) — encaja perfecto:
- Auth con email/Google/Apple.
- Tablas espejo de las de Dexie (mismas columnas) con RLS: `user_id = auth.uid()` o
  `exists(select 1 from nutritionist_clients where nutritionist_id = auth.uid() and client_id = user_id)`.
- Realtime para el chat.
- Storage para fotos de platos / informes PDF.

Alternativa: Firebase (Firestore) si se prefiere NoSQL; PocketBase si se quiere autoalojar.

### 8.2 Motor de sincronización (offline-first)

```
local (Dexie)  ⇄  SyncEngine  ⇄  Supabase
```

1. Tabla local `outbox` (o flag `dirty`) con los cambios pendientes.
2. `push`: envía filas con `updatedAt > lastPushAt` (upsert por `id`).
3. `pull`: pide filas con `updated_at > lastPullAt` del usuario y las aplica en Dexie
   (`bulkPut`); los conflictos se resuelven por `updatedAt` mayor.
4. Ejecutar al abrir la app, al volver online (`navigator.onLine`) y tras cada escritura (debounce).
5. Al iniciar sesión por primera vez: migrar `userId: 'local'` → `uid` y hacer push.

Como toda la escritura pasa por `store/repo.ts`, basta con llamar a `sync.markDirty(table, id)`
allí. La UI no cambia.

### 8.3 Roles y nutricionistas

Tablas nuevas:

| Tabla | Campos clave |
|---|---|
| `profiles` | `role: 'user' \| 'nutritionist' \| 'admin'`, `subscription` |
| `nutritionist_clients` | `nutritionist_id`, `client_id`, `status`, `since` |
| `plan_templates` | `owner_id`, `name`, `days`, `tags` — planes base del nutricionista |
| `assigned_plans` | `client_id`, `nutritionist_id`, `plan` (copia editable), `notes` |
| `comments` | `target_type` (`diary_day` / `plan` / `meal`), `target_id`, `author_id`, `text` |
| `messages` | `thread_id`, `sender_id`, `text`, `read_at` (chat; Realtime) |
| `checkins` | `client_id`, `date`, `weight`, `photos`, `mood`, `adherence` |

Flujo: un usuario de pago elige nutricionista → fila en `nutritionist_clients` → las RLS le dan
acceso de lectura a diario/planes/peso del cliente y de escritura a `assigned_plans` y `comments`.

### 8.4 Panel del nutricionista (app aparte o ruta `/pro`)

- **Lista de clientes** con semáforo de adherencia (kcal medias vs objetivo últimos 7 días, días
  registrados, tendencia de peso).
- **Ficha de cliente**: gráficas (peso, kcal/macros por día, micros cubiertos %, agua), diario
  navegable, plan activo, comentarios y chat.
- **Biblioteca de planes base**: crea desde el mismo generador; "Asignar a cliente" hace una
  copia que luego personaliza (los ingredientes ya tienen el botón *Sustituir*).
- Gráficas: Recharts o `@visx` (SVG, ligeras). Los datos ya están normalizados por día.

### 8.5 Monetización / seguridad

- Stripe (suscripción usuario ↔ acceso a nutricionista). Webhook → `profiles.subscription`.
- Datos de salud: cifrado en reposo (Supabase lo hace), consentimiento explícito, exportación y
  borrado de cuenta (RGPD). Nunca enviar datos a terceros sin permiso.

---

## 9. Ideas que encajan bien (backlog)

- **Escáner de códigos de barras** (Open Food Facts + `BarcodeDetector` / `@zxing/browser`).
- **Foto del plato → sugerencias** (visión con Claude): "¿es esto ~150 g de arroz?".
- **Rachas y logros** ("5 días con la fibra al 100 %"), widget de progreso.
- **Notificaciones** (Web Push): "No has registrado la cena", recordatorio de agua.
- **Batch cooking**: agrupar la lista de compra por día de cocinado.
- **Modo restaurante**: estimaciones rápidas por tipo de plato.
- **Importar desde otras apps** (MyFitnessPal CSV, Fitbit/Google Fit para gasto real).
- **Widget de peso con media móvil** (ya hay registro; falta suavizado).
- **Comparador**: "¿qué me falta hoy?" → lista de 3 alimentos que cubren los micros pendientes
  (ya tenemos los datos; es un ranking por nutriente/kcal).

---

## 10. Convenciones

- TypeScript estricto; sin `any`.
- Texto de UI en español, código y comentarios técnicos en español.
- Los valores nutricionales siempre **por 100 g** en el catálogo; las conversiones viven en
  `nutrientsFor()` y `rawGrams()`.
- Fechas como `YYYY-MM-DD` (clave de día) — nunca `Date` en la base.
- Entidades nuevas: extender `BaseEntity`, añadir tabla en `db.ts` con nueva `version()`,
  crear funciones en `repo.ts` y hooks en `hooks.ts`.
