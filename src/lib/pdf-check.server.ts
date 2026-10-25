// Reads an uploaded PDF and decides how it enters the review queue.
// The result is never `approved`: only the admin can publish a file.
import { extractText, getDocumentProxy } from 'unpdf'

import type { Lesson } from '@/data/lessons'
import { countWords, MIN_WORDS, scoreRelevance, type RelevanceBand } from '@/lib/relevance'
import type { SubmissionStatus } from '@/lib/submissions'

export interface PdfCheck {
  status: Extract<SubmissionStatus, 'pending' | 'review' | 'flagged'>
  score: number | null
  band: RelevanceBand | null
  explanation: string
  matchedKeywords: string[]
  flags: string[]
}

export const isPdf = (bytes: Uint8Array) => new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-'

const flagged = (flag: string, explanation: string): PdfCheck => ({
  status: 'flagged',
  score: null,
  band: null,
  explanation,
  matchedKeywords: [],
  flags: [flag],
})

async function readText(bytes: Uint8Array): Promise<string | PdfCheck> {
  try {
    const pdf = await getDocumentProxy(bytes)
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  } catch (e) {
    if (e instanceof Error && e.name === 'PasswordException') return flagged('Encrypted', 'The PDF is encrypted, so its text could not be read.')
    return flagged('Unreadable', 'The PDF could not be opened. It may be damaged.')
  }
}

export async function checkPdf(bytes: Uint8Array, lesson: Lesson): Promise<PdfCheck> {
  const text = await readText(bytes)
  if (typeof text !== 'string') return text
  const r = scoreRelevance(text, lesson)
  if (countWords(text) < MIN_WORDS) return flagged('Scanned / image-only', r.explanation)
  return {
    status: r.band === 'relevant' ? 'pending' : 'review',
    score: r.score,
    band: r.band,
    explanation: r.explanation,
    matchedKeywords: r.matchedKeywords,
    flags: [],
  }
}
