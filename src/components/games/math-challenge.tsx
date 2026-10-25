import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { GameOver, shuffle, type GameProps } from './shared'

const SECONDS = 60

interface Problem {
  prompt: string
  answer: string
  choices: string[]
}

const trigValues: [string, string][] = [
  ['sin 30°', '1/2'],
  ['cos 60°', '1/2'],
  ['sin 90°', '1'],
  ['cos 0°', '1'],
  ['tan 45°', '1'],
  ['sin 0°', '0'],
  ['cos 90°', '0'],
  ['sin 45°', '√2/2'],
  ['cos 30°', '√3/2'],
  ['tan 60°', '√3'],
  ['sin²40° + cos²40°', '1'],
  ['2 sin 15° cos 15°', '1/2'],
]
const sup = (n: number) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
const rnd = (n: number) => Math.floor(Math.random() * n)

function makeProblem(): Problem {
  const kind = rnd(4)
  let prompt: string
  let answer: string
  let pool: string[]
  if (kind === 0) {
    const [p, a] = trigValues[rnd(trigValues.length)]
    prompt = p
    answer = a
    pool = ['0', '1', '1/2', '√2/2', '√3/2', '√3', '−1']
  } else if (kind === 1) {
    const b = [2, 3, 5, 10][rnd(4)]
    const k = rnd(5) + (b === 10 ? -2 : 1)
    prompt = `log${b === 10 ? '' : '_' + b} ${b === 10 && k < 0 ? `0.${'0'.repeat(-k - 1)}1` : b ** k}`
    answer = String(k).replace('-', '−')
    pool = ['−2', '−1', '0', '1', '2', '3', '4', '5']
  } else if (kind === 2) {
    const b = [2, 3, 4, 5][rnd(4)]
    const k = rnd(4) + 1
    prompt = `${b}${sup(k)}`
    answer = String(b ** k)
    pool = [b ** k + b, b ** (k + 1), b * k, b ** k - 1].map(String)
  } else {
    const k = rnd(6) + 1
    prompt = `ln e${sup(k)}`
    answer = String(k)
    pool = ['0', '1', '2', '3', '4', '5', '6', 'e']
  }
  const wrong = shuffle([...new Set(pool)].filter((c) => c !== answer)).slice(0, 3)
  return { prompt, answer, choices: shuffle([answer, ...wrong]) }
}

export function MathChallenge({ onFinish, best }: GameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')
  const [left, setLeft] = useState(SECONDS)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  useEffect(() => {
    if (phase !== 'playing') return
    if (left <= 0) {
      setPhase('over')
      onFinish(score)
      return
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, left, score, onFinish])

  function start() {
    setScore(0)
    setStreak(0)
    setLeft(SECONDS)
    setProblem(makeProblem())
    setPhase('playing')
  }

  function answer(c: string) {
    if (!problem) return
    if (c === problem.answer) {
      setScore((s) => s + 10 + Math.min(streak, 5) * 2)
      setStreak((s) => s + 1)
      setFlash('right')
    } else {
      setStreak(0)
      setFlash('wrong')
    }
    setTimeout(() => setFlash(null), 250)
    setProblem(makeProblem())
  }

  if (phase === 'ready')
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
        <h2 className="font-display text-2xl font-bold">60-second sprint</h2>
        <p className="mt-2 text-sm text-muted-foreground">Exact trig values, logs, and powers. Streaks earn bonus points.</p>
        <Button className="mt-6" onClick={start}>
          Start
        </Button>
      </div>
    )
  if (phase === 'over') return <GameOver title={`${score} points`} detail="Time’s up!" best={best} onRetry={start} />

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="flex justify-between text-sm">
        <span className="math">⏱ {left}s</span>
        <span className="math">streak ×{streak}</span>
        <span className="math font-semibold">{score} pts</span>
      </div>
      <div
        className={`math mt-6 rounded-2xl border bg-card py-12 text-4xl font-semibold transition-colors motion-reduce:transition-none ${flash === 'right' ? 'border-success bg-success/10' : flash === 'wrong' ? 'border-destructive bg-destructive/10' : ''}`}
      >
        {problem?.prompt}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {problem?.choices.map((c) => (
          <Button key={c} variant="outline" size="lg" className="math h-14 text-lg" onClick={() => answer(c)}>
            {c}
          </Button>
        ))}
      </div>
    </div>
  )
}
