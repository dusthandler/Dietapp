import Dexie, { type EntityTable } from 'dexie'
import type { CustomFood, DayExtras, DiaryEntry, FoodUsage, Plan, Profile, Recipe, Setting } from './types'

/**
 * Base de datos local (IndexedDB vía Dexie).
 *
 * Diseño pensado para la futura sincronización con la nube: todas las tablas
 * tienen `userId`, `updatedAt` y borrado lógico (`deletedAt`). Un motor de sync
 * podrá enviar los cambios desde `updatedAt > lastSync` y aplicar los remotos.
 */
export class DietappDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  diary!: EntityTable<DiaryEntry, 'id'>
  recipes!: EntityTable<Recipe, 'id'>
  plans!: EntityTable<Plan, 'id'>
  customFoods!: EntityTable<CustomFood, 'id'>
  usage!: EntityTable<FoodUsage, 'id'>
  extras!: EntityTable<DayExtras, 'id'>
  settings!: EntityTable<Setting, 'id'>

  constructor() {
    super('dietapp')
    this.version(1).stores({
      profile: 'id, userId, updatedAt',
      diary: 'id, userId, date, [date+meal], updatedAt, recipeId, groupId',
      recipes: 'id, userId, name, updatedAt, uses',
      plans: 'id, userId, name, isActive, updatedAt',
      customFoods: 'id, userId, name, updatedAt',
      usage: 'id, userId, foodId, count, lastUsed, favorite',
      extras: 'id, userId, date, updatedAt',
      settings: 'id, userId, key',
    })
    // v2: índice por comida (para "habituales en el desayuno")
    this.version(2).stores({
      diary: 'id, userId, date, meal, [date+meal], updatedAt, recipeId, groupId',
    })
  }
}

export const db = new DietappDB()

export const LOCAL_USER = 'local'

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const now = () => Date.now()

export function stamp<T extends { id?: string; userId?: string; createdAt?: number; updatedAt?: number }>(e: T) {
  const t = now()
  return { ...e, id: e.id ?? uid(), userId: e.userId ?? LOCAL_USER, createdAt: e.createdAt ?? t, updatedAt: t }
}
