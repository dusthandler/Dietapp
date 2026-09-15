import type { Allergen, FoodCategory, FoodRole, Portion, PortionState, ShopUnit } from './foods.es'
import type { Nutrients } from './nutrients'

export type { Allergen, FoodCategory, FoodRole, Portion, PortionState, Nutrients, ShopUnit }

/** Campos comunes a toda entidad persistida — preparados para sincronizar con la nube. */
export interface BaseEntity {
  id: string
  /** 'local' hasta que exista autenticación en la nube */
  userId: string
  createdAt: number
  updatedAt: number
  /** Borrado lógico (para poder sincronizar borrados) */
  deletedAt?: number | null
}

export type Sex = 'male' | 'female'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'lose' | 'maintain' | 'gain'
export type Pace = 'slow' | 'normal' | 'fast'

export interface Profile extends BaseEntity {
  id: 'me'
  name: string
  sex: Sex
  /** Año de nacimiento (se mantiene por compatibilidad; usar birthDate si existe) */
  birthYear: number
  /** Fecha de nacimiento YYYY-MM-DD */
  birthDate?: string
  heightCm: number
  weightKg: number
  bodyFatPct?: number | null
  activity: Activity
  goal: Goal
  pace: Pace
  intolerances: Allergen[]
  /** Palabras clave personalizadas (p. ej. "fructosa", "cebolla") */
  customIntolerances: string[]
  dislikedFoodIds: string[]
  onboarded: boolean
  /** Ajustes manuales opcionales sobre los objetivos calculados */
  overrides?: Partial<Pick<Targets, 'kcal' | 'protein' | 'fat' | 'carbs'>>
}

export interface Targets {
  bmr: number
  tdee: number
  kcal: number
  protein: number
  fat: number
  carbs: number
  /** objetivos y límites de micronutrientes (por clave) */
  micros: Partial<Record<keyof Nutrients, number>>
}

export type MealId = 'desayuno' | 'media-manana' | 'comida' | 'merienda' | 'cena'

export const MEALS: { id: MealId; label: string; emoji: string; hourFrom: number }[] = [
  { id: 'desayuno', label: 'Desayuno', emoji: '🌅', hourFrom: 0 },
  { id: 'media-manana', label: 'Media mañana', emoji: '🍎', hourFrom: 10.5 },
  { id: 'comida', label: 'Comida', emoji: '🍽️', hourFrom: 13 },
  { id: 'merienda', label: 'Merienda', emoji: '🥪', hourFrom: 16.5 },
  { id: 'cena', label: 'Cena', emoji: '🌙', hourFrom: 20 },
]

export function mealForHour(h: number): MealId {
  let m: MealId = 'desayuno'
  for (const meal of MEALS) if (h >= meal.hourFrom) m = meal.id
  return m
}

/** Alimento unificado (curado en español, USDA o personalizado) */
export interface Food {
  id: string
  name: string
  nameEn?: string
  emoji: string
  cat: FoodCategory
  role: FoodRole
  /** por 100 g (crudo o único) */
  nutrients: Nutrients
  /** por 100 g cocinado (si existe variante) */
  nutrientsCooked?: Nutrients
  yield?: number
  portions: Portion[]
  allergens: Allergen[]
  aliases: string[]
  source: 'curated' | 'usda' | 'ciqual' | 'custom'
  /** texto normalizado para búsqueda */
  search: string
  /** true si el usuario ha ajustado sus valores (marca concreta); el original se conserva */
  overridden?: boolean
  /** unidad de compra (huevos, plátanos, latas…) */
  unit?: ShopUnit
}

export interface CustomFood extends BaseEntity {
  name: string
  emoji: string
  cat: FoodCategory
  role: FoodRole
  nutrients: Nutrients
  portions: Portion[]
  allergens: Allergen[]
  /**
   * Si está definido, este registro no es un alimento nuevo sino un ajuste de uno del catálogo
   * (id base, p. ej. "es:pollo-pechuga"): sus valores sustituyen a los originales en toda la app.
   */
  overrideOf?: string
}

export interface FoodRef {
  foodId: string
  grams: number
  state?: PortionState
  portionLabel?: string
}

export interface DiaryEntry extends BaseEntity, FoodRef {
  date: string // YYYY-MM-DD
  meal: MealId
  /** si vino de una receta, se agrupa visualmente */
  recipeId?: string | null
  recipeName?: string | null
  groupId?: string | null
  order: number
}

export interface RecipeIngredient extends FoodRef {
  id: string
}

export interface Recipe extends BaseEntity {
  name: string
  emoji: string
  ingredients: RecipeIngredient[]
  mealHint?: MealId | null
  notes?: string
  /** foto en miniatura optimizada (data URL WebP/JPEG, ~10-20 KB) */
  image?: string | null
  /** número de veces usada (para ordenar) */
  uses: number
}

export type Complexity = 'easy' | 'medium' | 'complex'
export type Variety = 'low' | 'medium' | 'high'

export interface PlanMeal {
  id: string
  meal: MealId
  title: string
  emoji: string
  items: RecipeIngredient[]
  /** id de la plantilla de la que salió (para sustituciones) */
  templateId?: string
  /** si el plato viene de una receta del usuario */
  recipeId?: string | null
  image?: string | null
}

export interface PlanDay {
  meals: PlanMeal[]
}

export interface Plan extends BaseEntity {
  name: string
  emoji: string
  days: PlanDay[] // 7 días, lunes → domingo
  params: { complexity: Complexity; variety: Variety; mealsPerDay: 3 | 4 | 5; mustHave?: string[] }
  isActive: boolean
  notes?: string
}

export interface FoodUsage extends BaseEntity {
  foodId: string
  count: number
  lastUsed: number
  favorite: boolean
  /** último tamaño de ración usado */
  lastGrams?: number
  lastState?: PortionState
  lastPortionLabel?: string
}

export interface DayExtras extends BaseEntity {
  date: string
  waterMl: number
  weightKg?: number | null
  note?: string
}

export interface Setting extends BaseEntity {
  key: string
  value: unknown
}
