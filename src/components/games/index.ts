import { Brain, Bug, Puzzle, Shuffle, Zap } from 'lucide-react'

import { EquationPuzzle } from './equation-puzzle'
import { FindTheError } from './find-the-error'
import { FormulaMatch } from './formula-match'
import { FormulaMemory } from './formula-memory'
import { MathChallenge } from './math-challenge'

export const games = [
  { id: 'formula-match', name: 'Formula Match', icon: Shuffle, blurb: 'Pair each formula name with its expression.', Component: FormulaMatch },
  { id: 'equation-puzzle', name: 'Equation Puzzle', icon: Puzzle, blurb: 'Rebuild a worked solution by putting its steps in order.', Component: EquationPuzzle },
  { id: 'math-challenge', name: 'Math Challenge', icon: Zap, blurb: 'A 60-second sprint of exact values, logs, and powers.', Component: MathChallenge },
  { id: 'find-the-error', name: 'Find the Error', icon: Bug, blurb: 'Spot the broken step in a solution and learn why it’s wrong.', Component: FindTheError },
  { id: 'formula-memory', name: 'Formula Memory', icon: Brain, blurb: 'Flip cards to find matching formula pairs in as few moves as you can.', Component: FormulaMemory },
] as const

export function getGame(id: string) {
  return games.find((g) => g.id === id)
}
