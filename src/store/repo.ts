/**
 * Repositorio de datos: única capa que habla con IndexedDB.
 * En el futuro, una implementación remota (o un motor de sync) sustituirá o
 * complementará estas funciones sin tocar la UI.
 */
import { db, stamp, uid, now, LOCAL_USER } from '@/data/db'
import type {
  CustomFood, DayExtras, DiaryEntry, FoodRef, FoodUsage, MealId, Plan, PlanDay, Profile, Recipe, RecipeIngredient,
} from '@/data/types'

// ───────────── Perfil ─────────────
export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get('me')
}

export async function saveProfile(patch: Partial<Profile>): Promise<Profile> {
  const existing = await db.profile.get('me')
  const base: Profile = existing ?? {
    id: 'me', userId: LOCAL_USER, createdAt: now(), updatedAt: now(), name: '', sex: 'male', birthYear: 1990,
    heightCm: 175, weightKg: 75, bodyFatPct: null, activity: 'light', goal: 'maintain', pace: 'normal',
    intolerances: [], customIntolerances: [], dislikedFoodIds: [], onboarded: false,
  }
  const next: Profile = { ...base, ...patch, id: 'me', updatedAt: now() }
  await db.profile.put(next)
  return next
}

// ───────────── Diario ─────────────
export async function addDiaryItem(date: string, meal: MealId, ref: FoodRef, extra?: Partial<DiaryEntry>): Promise<DiaryEntry> {
  const count = await db.diary.where('[date+meal]').equals([date, meal]).count()
  const entry = stamp<DiaryEntry>({ ...ref, ...extra, date, meal, order: count } as DiaryEntry)
  await db.diary.add(entry)
  await touchUsage(ref)
  return entry
}

export async function addRecipeToDiary(date: string, meal: MealId, recipe: Recipe, ingredients: RecipeIngredient[]) {
  const groupId = uid()
  const count = await db.diary.where('[date+meal]').equals([date, meal]).count()
  const entries = ingredients.map((ing, i) => stamp<DiaryEntry>({
    foodId: ing.foodId, grams: ing.grams, state: ing.state, portionLabel: ing.portionLabel,
    date, meal, recipeId: recipe.id, recipeName: recipe.name, groupId, order: count + i,
  } as DiaryEntry))
  await db.diary.bulkAdd(entries)
  await db.recipes.update(recipe.id, { uses: (recipe.uses ?? 0) + 1, updatedAt: now() })
  return groupId
}

export async function addItemsToDiary(date: string, meal: MealId, items: FoodRef[], groupName?: string, recipeId?: string | null) {
  const groupId = groupName ? uid() : null
  const count = await db.diary.where('[date+meal]').equals([date, meal]).count()
  const entries = items.map((ing, i) => stamp<DiaryEntry>({
    foodId: ing.foodId, grams: ing.grams, state: ing.state, portionLabel: ing.portionLabel,
    date, meal, recipeId: recipeId ?? null, recipeName: groupName ?? null, groupId, order: count + i,
  } as DiaryEntry))
  await db.diary.bulkAdd(entries)
}

export async function updateDiaryItem(id: string, patch: Partial<DiaryEntry>) {
  await db.diary.update(id, { ...patch, updatedAt: now() })
}

export async function removeDiaryItem(id: string) {
  await db.diary.delete(id)
}

export async function removeDiaryGroup(groupId: string) {
  await db.diary.where('groupId').equals(groupId).delete()
}

export async function clearMeal(date: string, meal: MealId) {
  await db.diary.where('[date+meal]').equals([date, meal]).delete()
}

export async function copyDay(from: string, to: string) {
  const entries = await db.diary.where('date').equals(from).toArray()
  await db.diary.bulkAdd(entries.map(e => stamp<DiaryEntry>({ ...e, id: undefined as unknown as string, date: to, createdAt: undefined as unknown as number } as DiaryEntry)))
}

// ───────────── Uso / favoritos ─────────────
async function touchUsage(ref: FoodRef) {
  const existing = await db.usage.where('foodId').equals(ref.foodId).first()
  if (existing) {
    await db.usage.update(existing.id, { count: existing.count + 1, lastUsed: now(), lastGrams: ref.grams, lastState: ref.state, lastPortionLabel: ref.portionLabel, updatedAt: now() })
  } else {
    await db.usage.add(stamp<FoodUsage>({ foodId: ref.foodId, count: 1, lastUsed: now(), favorite: false, lastGrams: ref.grams, lastState: ref.state, lastPortionLabel: ref.portionLabel } as FoodUsage))
  }
}

export async function toggleFavorite(foodId: string) {
  const existing = await db.usage.where('foodId').equals(foodId).first()
  if (existing) await db.usage.update(existing.id, { favorite: !existing.favorite, updatedAt: now() })
  else await db.usage.add(stamp<FoodUsage>({ foodId, count: 0, lastUsed: 0, favorite: true } as FoodUsage))
}

// ───────────── Recetas ─────────────
export async function saveRecipe(r: Partial<Recipe> & { name: string; ingredients: RecipeIngredient[] }): Promise<Recipe> {
  const recipe = stamp<Recipe>({ emoji: '🍽️', uses: 0, ...r } as Recipe)
  await db.recipes.put(recipe)
  return recipe
}

export async function deleteRecipe(id: string) {
  await db.recipes.delete(id)
}

// ───────────── Planes ─────────────
export async function savePlan(p: Partial<Plan> & { name: string; days: PlanDay[] }): Promise<Plan> {
  const plan = stamp<Plan>({ emoji: '📅', isActive: false, params: { complexity: 'easy', variety: 'medium', mealsPerDay: 4 }, ...p } as Plan)
  await db.plans.put(plan)
  return plan
}

export async function activatePlan(id: string | null) {
  await db.transaction('rw', db.plans, async () => {
    const all = await db.plans.toArray()
    for (const p of all) {
      const shouldBe = p.id === id
      if (p.isActive !== shouldBe) await db.plans.update(p.id, { isActive: shouldBe, updatedAt: now() })
    }
  })
}

export async function deletePlan(id: string) {
  await db.plans.delete(id)
}

// ───────────── Alimentos personalizados ─────────────
export async function saveCustomFood(f: Partial<CustomFood> & { name: string }): Promise<CustomFood> {
  const food = stamp<CustomFood>({ emoji: '🍽️', cat: 'platos', role: 'other', portions: [], allergens: [], ...f } as CustomFood)
  await db.customFoods.put(food)
  return food
}

export async function deleteCustomFood(id: string) {
  await db.customFoods.delete(id)
}

// ───────────── Extras del día (agua, peso) ─────────────
export async function setDayExtras(date: string, patch: Partial<DayExtras>) {
  const existing = await db.extras.where('date').equals(date).first()
  if (existing) await db.extras.update(existing.id, { ...patch, updatedAt: now() })
  else await db.extras.add(stamp<DayExtras>({ date, waterMl: 0, ...patch } as DayExtras))
}

// ───────────── Exportar / importar ─────────────
export async function exportAll() {
  const [profile, diary, recipes, plans, customFoods, usage, extras] = await Promise.all([
    db.profile.toArray(), db.diary.toArray(), db.recipes.toArray(), db.plans.toArray(), db.customFoods.toArray(), db.usage.toArray(), db.extras.toArray(),
  ])
  return { version: 1, exportedAt: new Date().toISOString(), profile, diary, recipes, plans, customFoods, usage, extras }
}

export async function importAll(data: Awaited<ReturnType<typeof exportAll>>) {
  await db.transaction('rw', [db.profile, db.diary, db.recipes, db.plans, db.customFoods, db.usage, db.extras], async () => {
    await Promise.all([db.profile.clear(), db.diary.clear(), db.recipes.clear(), db.plans.clear(), db.customFoods.clear(), db.usage.clear(), db.extras.clear()])
    await db.profile.bulkPut(data.profile ?? [])
    await db.diary.bulkPut(data.diary ?? [])
    await db.recipes.bulkPut(data.recipes ?? [])
    await db.plans.bulkPut(data.plans ?? [])
    await db.customFoods.bulkPut(data.customFoods ?? [])
    await db.usage.bulkPut(data.usage ?? [])
    await db.extras.bulkPut(data.extras ?? [])
  })
}

export async function wipeAll() {
  await db.delete()
  await db.open()
}
