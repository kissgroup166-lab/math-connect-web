import type { TopicId } from './lessons'

export interface QuizQuestion {
  id: string
  topic: TopicId
  lessonId: string
  prompt: string
  choices: string[]
  answer: number // index into choices
  explanation: string
}

const q = (
  id: string,
  topic: TopicId,
  lessonId: string,
  prompt: string,
  choices: string[],
  answer: number,
  explanation: string,
): QuizQuestion => ({ id, topic, lessonId, prompt, choices, answer, explanation })

export const questions: QuizQuestion[] = [
  // Trigonometric identities
  q('t1', 'trig', 'pythagorean-identities', 'sin²θ + cos²θ equals…', ['0', '1', 'tan²θ', '2'], 1, 'This is the fundamental Pythagorean identity from the unit circle.'),
  q('t2', 'trig', 'pythagorean-identities', 'Which is equivalent to sec²x − 1?', ['tan²x', 'cot²x', 'csc²x', 'sin²x'], 0, '1 + tan²x = sec²x, so sec²x − 1 = tan²x.'),
  q('t3', 'trig', 'pythagorean-identities', 'If cos θ = 3/5 in Quadrant I, sin θ =', ['3/4', '4/5', '−4/5', '5/4'], 1, 'sin²θ = 1 − 9/25 = 16/25 and sine is positive in QI.'),
  q('t4', 'trig', 'pythagorean-identities', 'Simplify csc²x − cot²x.', ['0', '−1', '1', 'sec²x'], 2, '1 + cot²x = csc²x rearranges to csc²x − cot²x = 1.'),
  q('t5', 'trig', 'sum-difference-identities', 'sin(A + B) =', ['sin A + sin B', 'sin A cos B + cos A sin B', 'cos A cos B − sin A sin B', 'sin A sin B + cos A cos B'], 1, 'The sine sum identity mixes sine and cosine.'),
  q('t6', 'trig', 'sum-difference-identities', 'cos 75° cos 15° − sin 75° sin 15° =', ['1', '1/2', '0', '√3/2'], 2, 'This is cos(75° + 15°) = cos 90° = 0.'),
  q('t7', 'trig', 'sum-difference-identities', 'The exact value of sin 15° is', ['(√6 − √2)/4', '(√6 + √2)/4', '√3/2', '1/4'], 0, 'sin(45° − 30°) = √2/2·√3/2 − √2/2·1/2.'),
  q('t8', 'trig', 'double-half-angle', 'sin 2θ =', ['2 sin θ', 'sin²θ', '2 sin θ cos θ', 'cos²θ − sin²θ'], 2, 'Set A = B = θ in the sine sum identity.'),
  q('t9', 'trig', 'double-half-angle', 'Which is NOT a form of cos 2θ?', ['cos²θ − sin²θ', '2cos²θ − 1', '1 − 2sin²θ', '2 sin θ cos θ'], 3, '2 sin θ cos θ is sin 2θ.'),
  q('t10', 'trig', 'double-half-angle', 'If sin θ = 3/5 and cos θ = 4/5, cos 2θ =', ['7/25', '24/25', '1/5', '−7/25'], 0, 'cos²θ − sin²θ = 16/25 − 9/25 = 7/25.'),
  // Exponential functions
  q('e1', 'exp', 'exponential-basics', 'f(x) = 2 · (0.5)ˣ represents', ['Growth', 'Decay', 'A line', 'A parabola'], 1, 'The base 0.5 is between 0 and 1.'),
  q('e2', 'exp', 'exponential-basics', 'The horizontal asymptote of y = 3ˣ − 4 is', ['y = 3', 'y = 0', 'y = −4', 'x = −4'], 2, 'The vertical shift k = −4 moves the asymptote.'),
  q('e3', 'exp', 'exponential-basics', 'The y-intercept of f(x) = 6 · 5ˣ is', ['5', '6', '30', '1'], 1, 'f(0) = 6 · 1 = 6.'),
  q('e4', 'exp', 'growth-decay-e', 'e is approximately', ['2.718', '3.142', '1.618', '2.236'], 0, 'e = lim (1 + 1/n)ⁿ ≈ 2.71828.'),
  q('e5', 'exp', 'growth-decay-e', 'The continuous growth formula is', ['A = P(1 + r)ᵗ', 'A = Peʳᵗ', 'A = Prt', 'A = P/eʳᵗ'], 1, 'Continuous compounding uses base e.'),
  q('e6', 'exp', 'growth-decay-e', 'A substance with half-life 3 h: what fraction remains after 9 h?', ['1/3', '1/8', '1/9', '1/6'], 1, '9/3 = 3 half-lives, (1/2)³ = 1/8.'),
  q('e7', 'exp', 'growth-decay-e', 'Annual decay of 15% has decay factor', ['0.15', '1.15', '0.85', '−0.15'], 2, 'Decay factor = 1 − 0.15.'),
  q('e8', 'exp', 'solving-exponential-equations', 'Solve 2ˣ = 64.', ['5', '6', '8', '32'], 1, '64 = 2⁶.'),
  q('e9', 'exp', 'solving-exponential-equations', 'Solve 9ˣ = 27.', ['3', '2/3', '3/2', '1/3'], 2, '3²ˣ = 3³ so 2x = 3.'),
  q('e10', 'exp', 'solving-exponential-equations', 'The solution of eˣ = 10 is', ['10/e', 'log 10', 'ln 10', 'e¹⁰'], 2, 'Take the natural log of both sides.'),
  // Logarithmic functions
  q('l1', 'log', 'logarithm-definition', 'log₂ 32 =', ['4', '5', '16', '6'], 1, '2⁵ = 32.'),
  q('l2', 'log', 'logarithm-definition', 'log_b 1 equals', ['1', 'b', '0', 'undefined'], 2, 'b⁰ = 1 for every valid base.'),
  q('l3', 'log', 'logarithm-definition', 'The domain of y = ln x is', ['All reals', 'x ≥ 0', 'x > 0', 'x ≠ 0'], 2, 'Logs are only defined for positive arguments.'),
  q('l4', 'log', 'logarithm-definition', 'log 0.001 =', ['−3', '3', '−2', '0.001'], 0, '10⁻³ = 0.001.'),
  q('l5', 'log', 'laws-of-logarithms', 'log(MN) =', ['log M · log N', 'log M + log N', 'log M − log N', 'N log M'], 1, 'Product law: multiplying inside adds logs.'),
  q('l6', 'log', 'laws-of-logarithms', 'ln(x⁴) =', ['4 + ln x', '(ln x)⁴', '4 ln x', 'ln 4x'], 2, 'Power law brings the exponent down.'),
  q('l7', 'log', 'laws-of-logarithms', 'log₃ 54 − log₃ 2 =', ['3', '27', '52', '2'], 0, 'log₃(54/2) = log₃ 27 = 3.'),
  q('l8', 'log', 'change-of-base-log-equations', 'log₅ 20 equals', ['ln 5 / ln 20', 'ln 20 / ln 5', 'ln 4', '20/5'], 1, 'Change of base: ln x / ln b.'),
  q('l9', 'log', 'change-of-base-log-equations', 'Solve log₂(x + 3) = 4.', ['1', '13', '16', '5'], 1, 'x + 3 = 2⁴ = 16.'),
  q('l10', 'log', 'change-of-base-log-equations', 'Solving log x + log(x − 3) = 1 gives', ['x = 5 only', 'x = −2 only', 'x = 5 or −2', 'x = 10'], 0, 'x(x − 3) = 10 gives 5 or −2, but −2 is extraneous.'),
]

export const PASS_MARK = 0.7
