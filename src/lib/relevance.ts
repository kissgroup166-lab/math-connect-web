// Relevance scoring for uploaded PDFs. Pure function over extracted text so it
// can run unchanged on the server once PDF extraction is wired up.
import type { Lesson } from '@/data/lessons'

export type RelevanceBand = 'relevant' | 'review' | 'unrelated'

export interface RelevanceResult {
  score: number
  band: RelevanceBand
  matchedKeywords: string[]
  matchedFormulas: string[]
  explanation: string
  needsManualReview: boolean
}

export function bandFor(score: number): RelevanceBand {
  if (score >= 80) return 'relevant'
  if (score >= 50) return 'review'
  return 'unrelated'
}

export const bandCopy: Record<RelevanceBand, { label: string; detail: string }> = {
  relevant: { label: 'Relevant', detail: 'Pending admin approval' },
  review: { label: 'Needs review', detail: 'Sent for manual review' },
  unrelated: { label: 'Likely unrelated', detail: 'Recommended for rejection' },
}

const normalize = (s: string) =>
  s.toLowerCase().replace(/\s+/g, ' ').replace(/[−–]/g, '-')

// Below this many words the file is probably scanned or image-only.
export const MIN_WORDS = 40

export const countWords = (text: string) => normalize(text).split(' ').filter(Boolean).length

export function scoreRelevance(text: string, lesson: Lesson): RelevanceResult {
  const body = normalize(text)

  if (countWords(text) < MIN_WORDS) {
    return {
      score: 0,
      band: 'review',
      matchedKeywords: [],
      matchedFormulas: [],
      explanation:
        'Very little readable text was found. The file may be scanned or image-only, so it was flagged for manual review.',
      needsManualReview: true,
    }
  }

  const matchedKeywords = lesson.keywords.filter((k) => body.includes(normalize(k)))
  const matchedFormulas = lesson.formulas
    .filter((f) => body.includes(normalize(f.expr).slice(0, 12)))
    .map((f) => f.expr)

  const kw = matchedKeywords.length / lesson.keywords.length
  const fm = lesson.formulas.length ? matchedFormulas.length / lesson.formulas.length : 0
  const title = body.includes(normalize(lesson.title)) ? 1 : 0
  const score = Math.round(Math.min(100, (kw * 0.6 + fm * 0.3 + title * 0.1) * 100 * 1.25))
  const band = bandFor(score)

  return {
    score,
    band,
    matchedKeywords,
    matchedFormulas,
    explanation: `Matched ${matchedKeywords.length} of ${lesson.keywords.length} lesson keywords and ${matchedFormulas.length} of ${lesson.formulas.length} key formulas${title ? ', and the lesson title appears in the text' : ''}. This score is an estimate — an admin makes the final decision.`,
    needsManualReview: band !== 'relevant',
  }
}
