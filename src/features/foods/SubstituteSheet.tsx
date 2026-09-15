import { useMemo, useState } from 'react'
import { ThumbsDown } from 'lucide-react'
import { Button, Sheet, haptic } from '@/components/ui'
import { amountText, catalog } from '@/data/foodDb'
import type { Food, FoodRef, Profile } from '@/data/types'
import { substitutes } from '@/lib/planGenerator'
import { sumRefs } from '@/store/hooks'
import { FoodPicker } from './FoodPicker'
import { MacroMini } from './PortionEditor'

/** Propone alternativas equivalentes (mismo rol, mismas kcal) a un alimento ya registrado */
export function SubstituteSheet({ open, ing, profile, onClose, onPick, onDislike }:
  { open: boolean; ing: FoodRef | null; profile: Profile; onClose: () => void; onPick: (food: Food, grams: number, state?: 'raw' | 'cooked') => void; onDislike?: (foodId: string) => void }) {
  const options = useMemo(() => (ing ? substitutes({ id: '', ...ing }, profile, 8) : []), [ing, profile])
  const food = ing ? catalog.get(ing.foodId) : undefined
  const [picking, setPicking] = useState(false)
  return (
    <>
      <Sheet open={open} onClose={onClose} title={food ? `Sustituir ${food.emoji} ${food.name}` : 'Sustituir'}>
        <p className="text-sm text-ink-2 mb-3">Alternativas equivalentes (mismas calorías aprox., mismo tipo de alimento):</p>
        <ul className="flex flex-col gap-1.5">
          {options.map(o => {
            const ref = { foodId: o.food.id, grams: o.grams, state: o.state }
            return (
              <li key={o.food.id}>
                <button className="press w-full flex items-center gap-3 p-2.5 rounded-2xl bg-surface-2 text-left" onClick={() => { onPick(o.food, o.grams, o.state); haptic(8) }}>
                  <span className="text-2xl w-9 text-center">{o.food.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{o.food.name}</div>
                    <div className="text-xs text-ink-3">{amountText(o.food, o.grams, o.state)}</div>
                  </span>
                  <MacroMini n={sumRefs([ref])} />
                </button>
              </li>
            )
          })}
          {options.length === 0 && <li className="text-center text-ink-3 py-6">No encuentro alternativas automáticas. Elige una manualmente.</li>}
        </ul>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" full onClick={() => setPicking(true)}>Elegir otro alimento</Button>
          {food && onDislike && <Button variant="danger" onClick={() => onDislike(food.id)} title="No me gusta: no volver a proponerlo"><ThumbsDown size={18} /></Button>}
        </div>
      </Sheet>
      <FoodPicker open={picking} onClose={() => setPicking(false)} title="Elegir sustituto" keepOpen={false}
        onPick={(ref: FoodRef, f: Food) => { setPicking(false); onPick(f, ref.grams, ref.state) }} />
    </>
  )
}
