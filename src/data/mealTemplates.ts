import type { Complexity, MealId, PortionState } from './types'

/**
 * Plantillas de platos para el generador de dietas.
 * Los ids de alimentos son los de la capa curada (foods.es.ts) sin el prefijo "es:".
 *  - g: gramos base (se escalan para cuadrar con las kcal objetivo de esa comida)
 *  - s: estado (crudo/cocinado) si el alimento tiene variantes
 *  - fixed: no se escala (aceite, condimentos, extras pequeños)
 *  - label: medida fácil para mostrar
 */
export interface TemplateItem { f: string; g: number; s?: PortionState; fixed?: boolean; label?: string }
export interface MealTemplate {
  id: string
  name: string
  emoji: string
  meals: MealId[]
  complexity: Complexity
  /** minutos aproximados de preparación */
  minutes: number
  items: TemplateItem[]
  tags?: ('veg' | 'fish' | 'meat' | 'sweet' | 'salty' | 'light' | 'batch')[]
}

const B: MealId[] = ['desayuno']
const S: MealId[] = ['media-manana', 'merienda']
const L: MealId[] = ['comida']
const D: MealId[] = ['cena']
const LD: MealId[] = ['comida', 'cena']

export const MEAL_TEMPLATES: MealTemplate[] = [
  // ───────────── DESAYUNOS ─────────────
  { id: 'b-yogur-avena-platano', name: 'Yogur griego con avena, plátano y nueces', emoji: '🥣', meals: B, complexity: 'easy', minutes: 3, tags: ['sweet'],
    items: [{ f: 'yogur-griego', g: 150, label: '1 tarro' }, { f: 'avena', g: 40, label: '1 bol pequeño' }, { f: 'platano', g: 120, label: '1 plátano' }, { f: 'nueces', g: 15, label: '3 nueces', fixed: true }] },
  { id: 'b-tostada-aguacate-huevo', name: 'Tostadas de aguacate con huevo cocido', emoji: '🥑', meals: B, complexity: 'easy', minutes: 10, tags: ['salty'],
    items: [{ f: 'pan-integral', g: 64, label: '2 rebanadas' }, { f: 'aguacate', g: 75, label: '½ aguacate' }, { f: 'huevo-cocido', g: 100, label: '2 huevos' }, { f: 'aceite-oliva', g: 5, fixed: true }] },
  { id: 'b-porridge', name: 'Porridge de avena con fresas y chía', emoji: '🍓', meals: B, complexity: 'easy', minutes: 6, tags: ['sweet'],
    items: [{ f: 'avena', g: 60, label: '1 bol' }, { f: 'leche-semi', g: 250, label: '1 taza' }, { f: 'fresas', g: 120, label: 'Un puñado' }, { f: 'chia', g: 12, label: '1 cucharada', fixed: true }, { f: 'miel', g: 7, fixed: true }] },
  { id: 'b-tostada-tomate-jamon', name: 'Tostadas con tomate, aceite y jamón', emoji: '🍅', meals: B, complexity: 'easy', minutes: 5, tags: ['salty'],
    items: [{ f: 'pan-blanco', g: 60, label: '¼ barra' }, { f: 'tomate', g: 60, label: '½ tomate' }, { f: 'aceite-oliva', g: 8, fixed: true, label: 'Un chorrito' }, { f: 'jamon-serrano', g: 45, label: '3 lonchas' }] },
  { id: 'b-revuelto', name: 'Revuelto de huevos con tostada y aguacate', emoji: '🍳', meals: B, complexity: 'easy', minutes: 8, tags: ['salty'],
    items: [{ f: 'huevos-revueltos', g: 122, label: '2 huevos' }, { f: 'pan-integral', g: 32, label: '1 tostada' }, { f: 'aguacate', g: 50, label: 'Para 1 tostada' }] },
  { id: 'b-cafe-tostada', name: 'Café con leche y tostada con mantequilla y mermelada', emoji: '☕', meals: B, complexity: 'easy', minutes: 4, tags: ['sweet'],
    items: [{ f: 'cafe-con-leche', g: 200, label: '1 taza grande' }, { f: 'pan-blanco', g: 60, label: '2 rebanadas' }, { f: 'mantequilla', g: 10, fixed: true }, { f: 'mermelada', g: 15, fixed: true }, { f: 'naranja', g: 150, label: '1 naranja' }] },
  { id: 'b-batido', name: 'Batido de proteína con plátano y avena', emoji: '🥤', meals: B, complexity: 'easy', minutes: 3, tags: ['sweet'],
    items: [{ f: 'proteina-whey', g: 30, label: '1 cazo' }, { f: 'platano', g: 120, label: '1 plátano' }, { f: 'avena', g: 40 }, { f: 'leche-semi', g: 250, label: '1 taza' }, { f: 'crema-cacahuete', g: 16, label: '1 cucharada', fixed: true }] },
  { id: 'b-granola', name: 'Bol de yogur con granola y arándanos', emoji: '🫐', meals: B, complexity: 'easy', minutes: 2, tags: ['sweet'],
    items: [{ f: 'yogur-natural', g: 250, label: '2 yogures' }, { f: 'granola', g: 50, label: '1 bol' }, { f: 'arandanos', g: 80 }] },
  { id: 'b-queso-batido', name: 'Queso fresco batido con frutos rojos y nueces', emoji: '🍓', meals: B, complexity: 'easy', minutes: 2, tags: ['sweet', 'light'],
    items: [{ f: 'queso-fresco-batido', g: 250, label: '1 bol' }, { f: 'frambuesas', g: 100 }, { f: 'nueces', g: 20, fixed: true }, { f: 'miel', g: 7, fixed: true }] },
  { id: 'b-tortitas-avena', name: 'Tortitas de avena y plátano', emoji: '🥞', meals: B, complexity: 'medium', minutes: 15, tags: ['sweet'],
    items: [{ f: 'avena', g: 50 }, { f: 'huevo', g: 106, label: '2 huevos' }, { f: 'platano', g: 120, label: '1 plátano' }, { f: 'yogur-griego-0', g: 100 }, { f: 'canela', g: 1, fixed: true }, { f: 'aceite-oliva', g: 4, fixed: true }] },
  { id: 'b-sandwich-pavo', name: 'Sándwich de pavo, queso y tomate', emoji: '🥪', meals: B, complexity: 'easy', minutes: 4, tags: ['salty'],
    items: [{ f: 'pan-molde', g: 56, label: '2 rebanadas' }, { f: 'pavo-fiambre', g: 60, label: '3 lonchas' }, { f: 'queso-lonchas', g: 20 }, { f: 'tomate', g: 60 }, { f: 'zumo-naranja', g: 200, label: '1 vaso' }] },
  { id: 'b-huevos-pan-fruta', name: 'Huevos a la plancha con pan y fruta', emoji: '🍳', meals: B, complexity: 'easy', minutes: 8, tags: ['salty'],
    items: [{ f: 'huevo-frito', g: 92, label: '2 huevos' }, { f: 'pan-integral', g: 64, label: '2 rebanadas' }, { f: 'kiwi', g: 150, label: '2 kiwis' }] },

  // ───────────── SNACKS (media mañana / merienda) ─────────────
  { id: 's-fruta-nueces', name: 'Fruta con un puñado de frutos secos', emoji: '🍎', meals: S, complexity: 'easy', minutes: 1,
    items: [{ f: 'manzana', g: 180, label: '1 manzana' }, { f: 'almendras', g: 25, label: 'Un puñado' }] },
  { id: 's-yogur-fruta', name: 'Yogur con fruta', emoji: '🥣', meals: S, complexity: 'easy', minutes: 2,
    items: [{ f: 'yogur-natural', g: 125, label: '1 yogur' }, { f: 'platano', g: 100 }] },
  { id: 's-tostada-cacahuete', name: 'Tostada con crema de cacahuete y plátano', emoji: '🥜', meals: S, complexity: 'easy', minutes: 3,
    items: [{ f: 'pan-integral', g: 32, label: '1 tostada' }, { f: 'crema-cacahuete', g: 16, label: '1 cucharada' }, { f: 'platano', g: 60, label: '½ plátano' }] },
  { id: 's-queso-fresco-fruta', name: 'Queso fresco con fruta', emoji: '🧀', meals: S, complexity: 'easy', minutes: 2,
    items: [{ f: 'queso-fresco', g: 75, label: '1 tarrina' }, { f: 'pera', g: 170, label: '1 pera' }] },
  { id: 's-hummus-zanahoria', name: 'Hummus con zanahoria y tortitas', emoji: '🥕', meals: S, complexity: 'easy', minutes: 3,
    items: [{ f: 'hummus', g: 60 }, { f: 'zanahoria', g: 100, s: 'raw', label: '1 zanahoria grande' }, { f: 'tortitas-arroz', g: 18, label: '2 tortitas' }] },
  { id: 's-batido', name: 'Batido de proteína', emoji: '🥤', meals: S, complexity: 'easy', minutes: 2,
    items: [{ f: 'proteina-whey', g: 30, label: '1 cazo' }, { f: 'leche-desnatada', g: 250, label: '1 taza' }] },
  { id: 's-skyr-arandanos', name: 'Skyr con arándanos', emoji: '🫐', meals: S, complexity: 'easy', minutes: 1,
    items: [{ f: 'yogur-griego-0', g: 170, label: '1 tarro' }, { f: 'arandanos', g: 60 }] },
  { id: 's-bocadillo-pavo', name: 'Mini bocadillo de pavo', emoji: '🥖', meals: S, complexity: 'easy', minutes: 3,
    items: [{ f: 'pan-blanco', g: 50 }, { f: 'pavo-fiambre', g: 40 }, { f: 'tomate', g: 40 }] },
  { id: 's-chocolate-nueces', name: 'Onzas de chocolate negro con nueces', emoji: '🍫', meals: S, complexity: 'easy', minutes: 1,
    items: [{ f: 'chocolate-negro', g: 20, label: '2 onzas' }, { f: 'nueces', g: 20 }] },
  { id: 's-huevo-fruta', name: 'Huevo cocido y mandarinas', emoji: '🥚', meals: S, complexity: 'easy', minutes: 2,
    items: [{ f: 'huevo-cocido', g: 50, label: '1 huevo' }, { f: 'mandarina', g: 160, label: '2 mandarinas' }] },

  // ───────────── COMIDAS ─────────────
  { id: 'l-arroz-pollo-verduras', name: 'Arroz con pollo y verduras salteadas', emoji: '🍚', meals: LD, complexity: 'easy', minutes: 25, tags: ['meat', 'batch'],
    items: [{ f: 'arroz-blanco', g: 80, s: 'raw', label: '⅓ plato en crudo' }, { f: 'pechuga-pollo', g: 180, s: 'raw', label: '1 pechuga' }, { f: 'pimiento-rojo', g: 75, label: '½ pimiento' }, { f: 'calabacin', g: 120, s: 'raw', label: '½ calabacín' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'salsa-soja', g: 8, fixed: true }] },
  { id: 'l-pasta-atun', name: 'Pasta con atún y tomate', emoji: '🍝', meals: LD, complexity: 'easy', minutes: 15, tags: ['fish'],
    items: [{ f: 'pasta', g: 90, s: 'raw', label: '1 ración en crudo' }, { f: 'atun-lata-natural', g: 112, label: '2 latas' }, { f: 'tomate-frito', g: 100 }, { f: 'cebolla', g: 55, s: 'raw', label: '½ cebolla' }, { f: 'aceite-oliva', g: 8, fixed: true }, { f: 'parmesano', g: 10, fixed: true }] },
  { id: 'l-lentejas', name: 'Lentejas con verduras', emoji: '🫘', meals: L, complexity: 'medium', minutes: 45, tags: ['veg', 'batch'],
    items: [{ f: 'lentejas', g: 80, s: 'raw', label: '1 ración en crudo' }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'pimiento-verde', g: 60 }, { f: 'patata', g: 120, s: 'raw', label: '1 patata pequeña' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'pimenton', g: 2, fixed: true }, { f: 'ajo', g: 6, fixed: true }] },
  { id: 'l-garbanzos-espinacas', name: 'Garbanzos con espinacas y huevo', emoji: '🥬', meals: LD, complexity: 'medium', minutes: 20, tags: ['veg'],
    items: [{ f: 'garbanzos', g: 240, s: 'cooked', label: '1 bote escurrido' }, { f: 'espinacas', g: 150, s: 'raw' }, { f: 'huevo-cocido', g: 100, label: '2 huevos' }, { f: 'ajo', g: 6, fixed: true }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'pimenton', g: 2, fixed: true }] },
  { id: 'l-ensalada-garbanzos-atun', name: 'Ensalada de garbanzos con atún', emoji: '🥗', meals: LD, complexity: 'easy', minutes: 8, tags: ['fish', 'light'],
    items: [{ f: 'garbanzos', g: 240, s: 'cooked', label: '1 bote escurrido' }, { f: 'atun-lata-natural', g: 112, label: '2 latas' }, { f: 'tomate', g: 125, label: '1 tomate' }, { f: 'pepino', g: 75, label: '¼ pepino' }, { f: 'cebolla', g: 30, s: 'raw' }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'vinagre', g: 5, fixed: true }] },
  { id: 'l-salmon-patata-brocoli', name: 'Salmón al horno con patata y brócoli', emoji: '🐟', meals: LD, complexity: 'medium', minutes: 30, tags: ['fish'],
    items: [{ f: 'salmon', g: 180, s: 'raw', label: '1 lomo' }, { f: 'patata', g: 300, s: 'raw', label: '1 patata grande' }, { f: 'brocoli', g: 150, s: 'raw', label: '½ plato' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'limon', g: 25, fixed: true }] },
  { id: 'l-ternera-arroz-ensalada', name: 'Ternera a la plancha con arroz y ensalada', emoji: '🥩', meals: LD, complexity: 'easy', minutes: 20, tags: ['meat'],
    items: [{ f: 'ternera-filete', g: 150, s: 'raw', label: '1 filete' }, { f: 'arroz-blanco', g: 70, s: 'raw', label: '¼ plato en crudo' }, { f: 'lechuga', g: 80 }, { f: 'tomate', g: 90 }, { f: 'aceite-oliva', g: 12, fixed: true }] },
  { id: 'l-pollo-curry', name: 'Pollo al curry con arroz basmati', emoji: '🍛', meals: LD, complexity: 'complex', minutes: 40, tags: ['meat', 'batch'],
    items: [{ f: 'pechuga-pollo', g: 180, s: 'raw', label: '1 pechuga' }, { f: 'arroz-blanco', g: 75, s: 'raw' }, { f: 'leche-coco', g: 100 }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'pimiento-rojo', g: 75 }, { f: 'tomate-triturado', g: 100 }, { f: 'aceite-oliva', g: 8, fixed: true }, { f: 'jengibre', g: 5, fixed: true }, { f: 'ajo', g: 6, fixed: true }] },
  { id: 'l-paella', name: 'Arroz con gambas, calamar y verduras', emoji: '🥘', meals: L, complexity: 'complex', minutes: 50, tags: ['fish', 'batch'],
    items: [{ f: 'arroz-redondo', g: 80, s: 'raw' }, { f: 'gambas', g: 100, s: 'raw' }, { f: 'calamar', g: 100 }, { f: 'judias-verdes', g: 80, s: 'raw' }, { f: 'pimiento-rojo', g: 60 }, { f: 'tomate-triturado', g: 80 }, { f: 'aceite-oliva', g: 15, fixed: true }, { f: 'ajo', g: 6, fixed: true }, { f: 'pimenton', g: 2, fixed: true }] },
  { id: 'l-wrap-pollo', name: 'Wrap de pollo con verduras', emoji: '🌯', meals: LD, complexity: 'easy', minutes: 15, tags: ['meat'],
    items: [{ f: 'tortilla-trigo', g: 60, label: '1 tortilla grande' }, { f: 'pechuga-pollo', g: 150, s: 'raw' }, { f: 'lechuga', g: 40 }, { f: 'tomate', g: 60 }, { f: 'aguacate', g: 50 }, { f: 'yogur-griego-0', g: 40, fixed: true }] },
  { id: 'l-quinoa-verduras-huevo', name: 'Bol de quinoa con verduras asadas y huevo', emoji: '🥣', meals: LD, complexity: 'medium', minutes: 30, tags: ['veg'],
    items: [{ f: 'quinoa', g: 70, s: 'raw' }, { f: 'calabacin', g: 120, s: 'raw' }, { f: 'berenjena', g: 150, s: 'raw' }, { f: 'pimiento-rojo', g: 75 }, { f: 'huevo-escalfado', g: 100, label: '2 huevos' }, { f: 'aceite-oliva', g: 12, fixed: true }] },
  { id: 'l-hamburguesa-casera', name: 'Hamburguesa casera con patata asada', emoji: '🍔', meals: LD, complexity: 'medium', minutes: 30, tags: ['meat'],
    items: [{ f: 'ternera-picada-magra', g: 150, s: 'raw', label: '1 hamburguesa grande' }, { f: 'pan-hamburguesa', g: 50 }, { f: 'lechuga', g: 30 }, { f: 'tomate', g: 60 }, { f: 'queso-lonchas', g: 20, fixed: true }, { f: 'patata-asada', g: 170, label: '1 patata asada' }, { f: 'aceite-oliva', g: 8, fixed: true }] },
  { id: 'l-guiso-ternera', name: 'Guiso de ternera con patatas y guisantes', emoji: '🍲', meals: L, complexity: 'complex', minutes: 90, tags: ['meat', 'batch'],
    items: [{ f: 'ternera-guiso', g: 150 }, { f: 'patata', g: 250, s: 'raw' }, { f: 'guisantes', g: 80 }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'tomate-triturado', g: 100 }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'vino-tinto', g: 50, fixed: true }] },
  { id: 'l-fajitas-pavo', name: 'Fajitas de pavo con pimientos', emoji: '🌮', meals: LD, complexity: 'medium', minutes: 20, tags: ['meat'],
    items: [{ f: 'pechuga-pavo', g: 160, s: 'raw' }, { f: 'tortilla-trigo', g: 80, label: '2 tortillas' }, { f: 'pimiento-rojo', g: 75 }, { f: 'pimiento-verde', g: 60 }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'aceite-oliva', g: 8, fixed: true }, { f: 'yogur-griego-0', g: 40, fixed: true }] },
  { id: 'l-cesar', name: 'Ensalada César con pollo', emoji: '🥗', meals: LD, complexity: 'medium', minutes: 15, tags: ['meat', 'light'],
    items: [{ f: 'pechuga-pollo', g: 160, s: 'raw' }, { f: 'lechuga', g: 120, label: '1 ensalada grande' }, { f: 'parmesano', g: 15 }, { f: 'pan-blanco', g: 30, label: 'Picatostes' }, { f: 'mayonesa-light', g: 20, fixed: true }, { f: 'aceite-oliva', g: 6, fixed: true }] },
  { id: 'l-bolonesa', name: 'Pasta integral con boloñesa de pavo', emoji: '🍝', meals: LD, complexity: 'medium', minutes: 30, tags: ['meat', 'batch'],
    items: [{ f: 'pasta-integral', g: 90, s: 'raw' }, { f: 'pavo-picado', g: 150, s: 'raw' }, { f: 'tomate-triturado', g: 150 }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'zanahoria', g: 50, s: 'raw' }, { f: 'aceite-oliva', g: 8, fixed: true }, { f: 'parmesano', g: 10, fixed: true }, { f: 'oregano', g: 1, fixed: true }] },
  { id: 'l-cuscus-pollo', name: 'Cuscús con pollo y verduras', emoji: '🥘', meals: LD, complexity: 'medium', minutes: 25, tags: ['meat'],
    items: [{ f: 'cuscus', g: 70, s: 'raw' }, { f: 'pechuga-pollo', g: 160, s: 'raw' }, { f: 'calabacin', g: 100, s: 'raw' }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'garbanzos', g: 80, s: 'cooked' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'pasas', g: 15, fixed: true }] },
  { id: 'l-pescado-horno', name: 'Pescado al horno con patatas y cebolla', emoji: '🐟', meals: LD, complexity: 'easy', minutes: 35, tags: ['fish'],
    items: [{ f: 'merluza', g: 300, s: 'raw', label: '2 filetes' }, { f: 'patata', g: 250, s: 'raw' }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'pimiento-rojo', g: 60 }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'limon', g: 25, fixed: true }] },
  { id: 'l-tortilla-patatas', name: 'Tortilla de patatas con ensalada', emoji: '🍳', meals: LD, complexity: 'medium', minutes: 30, tags: ['veg'],
    items: [{ f: 'huevo', g: 180, label: '3 huevos' }, { f: 'patata', g: 250, s: 'raw' }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'aceite-oliva', g: 15, fixed: true }, { f: 'lechuga', g: 80 }, { f: 'tomate', g: 90 }] },
  { id: 'l-poke', name: 'Poke bowl de salmón', emoji: '🍣', meals: LD, complexity: 'complex', minutes: 25, tags: ['fish'],
    items: [{ f: 'salmon', g: 150, s: 'raw' }, { f: 'arroz-blanco', g: 70, s: 'raw' }, { f: 'aguacate', g: 75 }, { f: 'edamame', g: 60 }, { f: 'pepino', g: 75 }, { f: 'zanahoria', g: 50, s: 'raw' }, { f: 'salsa-soja', g: 10, fixed: true }, { f: 'sesamo', g: 5, fixed: true }, { f: 'alga-nori', g: 3, fixed: true }] },
  { id: 'l-alubias-verduras', name: 'Alubias blancas con verduras', emoji: '🫘', meals: L, complexity: 'medium', minutes: 40, tags: ['veg', 'batch'],
    items: [{ f: 'alubias-blancas', g: 240, s: 'cooked', label: '1 bote escurrido' }, { f: 'puerro', g: 90, s: 'raw' }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'judias-verdes', g: 100, s: 'raw' }, { f: 'patata', g: 120, s: 'raw' }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'pimenton', g: 2, fixed: true }] },
  { id: 'l-revuelto-gambas', name: 'Revuelto de gambas y espárragos con pan', emoji: '🦐', meals: LD, complexity: 'easy', minutes: 12, tags: ['fish'],
    items: [{ f: 'huevo', g: 120, label: '2 huevos L' }, { f: 'gambas', g: 120, s: 'raw' }, { f: 'esparragos', g: 110, s: 'raw', label: '6 espárragos' }, { f: 'pan-integral', g: 64 }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'ajo', g: 3, fixed: true }] },
  { id: 'l-lomo-pure', name: 'Lomo a la plancha con puré de patata y judías', emoji: '🥓', meals: LD, complexity: 'easy', minutes: 20, tags: ['meat'],
    items: [{ f: 'lomo-cerdo', g: 150, s: 'raw', label: '2 filetes de lomo' }, { f: 'pure-patata', g: 200 }, { f: 'judias-verdes', g: 150, s: 'raw' }, { f: 'aceite-oliva', g: 8, fixed: true }] },
  { id: 'l-arroz-integral-tofu', name: 'Arroz integral con tofu y verduras', emoji: '🧊', meals: LD, complexity: 'medium', minutes: 30, tags: ['veg'],
    items: [{ f: 'arroz-integral', g: 75, s: 'raw' }, { f: 'tofu', g: 150 }, { f: 'brocoli', g: 120, s: 'raw' }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'champinones', g: 100, s: 'raw' }, { f: 'salsa-soja', g: 12, fixed: true }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'sesamo', g: 5, fixed: true }] },

  // ───────────── CENAS ─────────────
  { id: 'd-merluza-patatas-brocoli', name: 'Merluza con patatas hervidas, brócoli y nueces', emoji: '🐟', meals: D, complexity: 'easy', minutes: 25, tags: ['fish', 'light'],
    items: [{ f: 'merluza', g: 300, s: 'raw', label: '2 filetes' }, { f: 'patata', g: 360, s: 'raw', label: '2 patatas medianas' }, { f: 'brocoli', g: 100, s: 'raw', label: 'Un puñado' }, { f: 'nueces', g: 30, label: 'Un puñado', fixed: true }, { f: 'aceite-oliva', g: 10, fixed: true }] },
  { id: 'd-tortilla-ensalada', name: 'Tortilla francesa con ensalada y pan', emoji: '🍳', meals: D, complexity: 'easy', minutes: 10, tags: ['light'],
    items: [{ f: 'tortilla-francesa', g: 122, label: 'Tortilla de 2 huevos' }, { f: 'lechuga', g: 80 }, { f: 'tomate', g: 125 }, { f: 'pan-integral', g: 32 }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'aceitunas', g: 20, fixed: true }] },
  { id: 'd-crema-calabaza-pavo', name: 'Crema de calabaza y pechuga de pavo', emoji: '🎃', meals: D, complexity: 'medium', minutes: 30, tags: ['light', 'batch'],
    items: [{ f: 'calabaza', g: 250, s: 'raw' }, { f: 'puerro', g: 90, s: 'raw' }, { f: 'patata', g: 100, s: 'raw' }, { f: 'pechuga-pavo', g: 150, s: 'raw' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'pipas-calabaza', g: 10, fixed: true }] },
  { id: 'd-ensalada-pollo-aguacate', name: 'Ensalada de pollo con aguacate', emoji: '🥗', meals: D, complexity: 'easy', minutes: 15, tags: ['meat', 'light'],
    items: [{ f: 'pechuga-pollo', g: 150, s: 'raw' }, { f: 'mezclum', g: 70 }, { f: 'aguacate', g: 75 }, { f: 'tomate', g: 100, label: '6 cherry' }, { f: 'maiz-dulce', g: 40 }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'vinagre', g: 5, fixed: true }] },
  { id: 'd-salmon-esparragos', name: 'Salmón a la plancha con espárragos', emoji: '🐟', meals: D, complexity: 'easy', minutes: 15, tags: ['fish', 'light'],
    items: [{ f: 'salmon', g: 160, s: 'raw' }, { f: 'esparragos', g: 150, s: 'raw' }, { f: 'boniato', g: 150, s: 'raw' }, { f: 'aceite-oliva', g: 8, fixed: true }, { f: 'limon', g: 25, fixed: true }] },
  { id: 'd-revuelto-setas', name: 'Revuelto de champiñones y espinacas con pan', emoji: '🍄', meals: D, complexity: 'easy', minutes: 12, tags: ['veg', 'light'],
    items: [{ f: 'huevo', g: 120, label: '2 huevos L' }, { f: 'champinones', g: 150, s: 'raw' }, { f: 'espinacas', g: 100, s: 'raw' }, { f: 'pan-integral', g: 64 }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'ajo', g: 3, fixed: true }] },
  { id: 'd-sopa-verduras-huevo', name: 'Sopa de verduras con fideos y huevo', emoji: '🍲', meals: D, complexity: 'medium', minutes: 30, tags: ['veg', 'light', 'batch'],
    items: [{ f: 'zanahoria', g: 70, s: 'raw' }, { f: 'puerro', g: 90, s: 'raw' }, { f: 'apio', g: 40 }, { f: 'calabacin', g: 100, s: 'raw' }, { f: 'pasta', g: 40, s: 'raw', label: 'Fideos' }, { f: 'huevo-cocido', g: 100, label: '2 huevos' }, { f: 'aceite-oliva', g: 8, fixed: true }] },
  { id: 'd-papillote', name: 'Pescado al papillote con verduras', emoji: '🐟', meals: D, complexity: 'medium', minutes: 30, tags: ['fish', 'light'],
    items: [{ f: 'lubina', g: 200, s: 'raw' }, { f: 'calabacin', g: 100, s: 'raw' }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'patata', g: 150, s: 'raw' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'limon', g: 25, fixed: true }] },
  { id: 'd-tofu-salteado', name: 'Tofu salteado con verduras y fideos de arroz', emoji: '🍜', meals: D, complexity: 'medium', minutes: 20, tags: ['veg'],
    items: [{ f: 'tofu', g: 150 }, { f: 'fideos-arroz', g: 60, s: 'raw' }, { f: 'brocoli', g: 100, s: 'raw' }, { f: 'pimiento-rojo', g: 75 }, { f: 'champinones', g: 80, s: 'raw' }, { f: 'salsa-soja', g: 12, fixed: true }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'jengibre', g: 5, fixed: true }] },
  { id: 'd-dorada-horno', name: 'Dorada al horno con patatas panadera', emoji: '🐟', meals: D, complexity: 'complex', minutes: 45, tags: ['fish'],
    items: [{ f: 'dorada', g: 250, s: 'raw', label: '1 dorada de ración' }, { f: 'patata', g: 250, s: 'raw' }, { f: 'cebolla', g: 110, s: 'raw' }, { f: 'pimiento-verde', g: 60 }, { f: 'aceite-oliva', g: 15, fixed: true }, { f: 'vino-tinto', g: 30, fixed: true }, { f: 'ajo', g: 6, fixed: true }] },
  { id: 'd-wok-ternera', name: 'Wok de ternera con verduras', emoji: '🥢', meals: D, complexity: 'medium', minutes: 20, tags: ['meat'],
    items: [{ f: 'falda-ternera', g: 150, s: 'raw' }, { f: 'pimiento-rojo', g: 75 }, { f: 'calabacin', g: 100, s: 'raw' }, { f: 'zanahoria', g: 70, s: 'raw' }, { f: 'arroz-blanco', g: 50, s: 'raw' }, { f: 'salsa-soja', g: 12, fixed: true }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'sesamo', g: 4, fixed: true }] },
  { id: 'd-ensalada-lentejas', name: 'Ensalada de lentejas con queso feta', emoji: '🥗', meals: D, complexity: 'easy', minutes: 10, tags: ['veg', 'light'],
    items: [{ f: 'lentejas', g: 240, s: 'cooked', label: '1 bote escurrido' }, { f: 'tomate', g: 100 }, { f: 'pepino', g: 75 }, { f: 'pimiento-rojo', g: 50 }, { f: 'feta', g: 40 }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'vinagre', g: 5, fixed: true }] },
  { id: 'd-sandwich-pavo-ensalada', name: 'Sándwich de pavo y queso con ensalada', emoji: '🥪', meals: D, complexity: 'easy', minutes: 6, tags: ['light'],
    items: [{ f: 'pan-integral', g: 64, label: '2 rebanadas' }, { f: 'pavo-fiambre', g: 60 }, { f: 'queso-lonchas', g: 20 }, { f: 'tomate', g: 60 }, { f: 'lechuga', g: 60 }, { f: 'aceite-oliva', g: 6, fixed: true }] },
  { id: 'd-pollo-verduras-horno', name: 'Muslos de pollo al horno con verduras', emoji: '🍗', meals: D, complexity: 'medium', minutes: 45, tags: ['meat'],
    items: [{ f: 'muslo-pollo', g: 220, s: 'raw', label: '2 contramuslos' }, { f: 'patata', g: 200, s: 'raw' }, { f: 'calabacin', g: 120, s: 'raw' }, { f: 'cebolla', g: 55, s: 'raw' }, { f: 'aceite-oliva', g: 10, fixed: true }, { f: 'pimenton', g: 2, fixed: true }] },
  { id: 'd-huevos-rotos', name: 'Huevos con patata asada y jamón', emoji: '🍳', meals: D, complexity: 'easy', minutes: 25, tags: ['meat'],
    items: [{ f: 'huevo-frito', g: 92, label: '2 huevos' }, { f: 'patata-asada', g: 200 }, { f: 'jamon-serrano', g: 30 }, { f: 'pimiento-verde', g: 60 }, { f: 'aceite-oliva', g: 6, fixed: true }] },
  { id: 'd-gazpacho-tortilla', name: 'Gazpacho y tortilla de calabacín', emoji: '🍅', meals: D, complexity: 'medium', minutes: 20, tags: ['veg', 'light'],
    items: [{ f: 'tomate', g: 300 }, { f: 'pepino', g: 75 }, { f: 'pimiento-verde', g: 40 }, { f: 'pan-blanco', g: 30 }, { f: 'aceite-oliva', g: 15, fixed: true }, { f: 'vinagre', g: 8, fixed: true }, { f: 'huevo', g: 120, label: '2 huevos' }, { f: 'calabacin', g: 120, s: 'raw' }] },
  { id: 'd-caballa-ensalada', name: 'Caballa a la plancha con ensalada de patata', emoji: '🐟', meals: D, complexity: 'easy', minutes: 20, tags: ['fish'],
    items: [{ f: 'caballa', g: 200, s: 'raw' }, { f: 'patata', g: 250, s: 'raw' }, { f: 'cebolleta', g: 25 }, { f: 'tomate', g: 90 }, { f: 'aceite-oliva', g: 12, fixed: true }, { f: 'vinagre', g: 5, fixed: true }] },
]

export const TEMPLATE_BY_ID = new Map(MEAL_TEMPLATES.map(t => [t.id, t]))

export const COMPLEXITY_LABELS: Record<Complexity, { label: string; desc: string; emoji: string }> = {
  easy: { label: 'Fácil', desc: 'Platos de menos de 25 min, pocos ingredientes', emoji: '⚡' },
  medium: { label: 'Media', desc: 'Algo de cocina, 20-45 min', emoji: '🍳' },
  complex: { label: 'Elaborada', desc: 'Guisos, horno, más pasos', emoji: '👨‍🍳' },
}

export const VARIETY_LABELS: Record<'low' | 'medium' | 'high', { label: string; desc: string; emoji: string }> = {
  low: { label: 'Poca', desc: 'Lo mismo cada día. Compra y cocina en bloque.', emoji: '🔁' },
  medium: { label: 'Media', desc: '2-3 opciones que se van alternando', emoji: '🔀' },
  high: { label: 'Mucha', desc: 'Cada día algo diferente', emoji: '🌈' },
}
