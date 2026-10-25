// Lesson catalog. This is real course content (not a stub). Keywords and
// formulas are also what the PDF relevance check compares uploads against.

export type TopicId = 'trig' | 'exp' | 'log'

export interface Topic {
  id: TopicId
  name: string
  short: string
  blurb: string
}

export interface WorkedExample {
  problem: string
  steps: string[]
  answer: string
}

export interface PracticeItem {
  prompt: string
  answer: string
  hint: string
}

export interface Lesson {
  id: string
  topic: TopicId
  title: string
  minutes: number
  level: 'Foundations' | 'Core' | 'Applied'
  summary: string
  formulas: { label: string; expr: string }[]
  explanation: string[]
  examples: WorkedExample[]
  practice: PracticeItem[]
  keywords: string[]
}

export const topics: Topic[] = [
  {
    id: 'trig',
    name: 'Trigonometric Identities',
    short: 'Trig',
    blurb: 'Pythagorean, angle-sum, and double-angle identities — and how to prove them.',
  },
  {
    id: 'exp',
    name: 'Exponential Functions',
    short: 'Exponential',
    blurb: 'Growth, decay, the number e, and solving exponential equations.',
  },
  {
    id: 'log',
    name: 'Logarithmic Functions',
    short: 'Logarithms',
    blurb: 'Logs as inverses, the laws of logarithms, and change of base.',
  },
]

export const lessons: Lesson[] = [
  {
    id: 'pythagorean-identities',
    topic: 'trig',
    title: 'Pythagorean Identities',
    minutes: 15,
    level: 'Foundations',
    summary: 'Derive sin²θ + cos²θ = 1 from the unit circle and use its two cousins.',
    formulas: [
      { label: 'Fundamental', expr: 'sin²θ + cos²θ = 1' },
      { label: 'Tangent form', expr: '1 + tan²θ = sec²θ' },
      { label: 'Cotangent form', expr: '1 + cot²θ = csc²θ' },
    ],
    explanation: [
      'On the unit circle a point at angle θ has coordinates (cos θ, sin θ). Because the radius is 1, the Pythagorean theorem gives x² + y² = 1, which is exactly sin²θ + cos²θ = 1.',
      'Divide every term by cos²θ to get 1 + tan²θ = sec²θ. Divide by sin²θ instead to get 1 + cot²θ = csc²θ.',
      'These identities let you swap between functions — for example, replacing sin²θ with 1 − cos²θ to get an expression in a single function.',
    ],
    examples: [
      {
        problem: 'If sin θ = 3/5 and θ is in Quadrant II, find cos θ.',
        steps: [
          'cos²θ = 1 − sin²θ = 1 − 9/25 = 16/25',
          'cos θ = ±4/5',
          'Cosine is negative in Quadrant II.',
        ],
        answer: 'cos θ = −4/5',
      },
      {
        problem: 'Simplify (1 − cos²x) / sin x.',
        steps: ['1 − cos²x = sin²x', 'sin²x / sin x = sin x'],
        answer: 'sin x',
      },
    ],
    practice: [
      { prompt: 'Simplify sec²x − tan²x.', answer: '1', hint: 'Rearrange 1 + tan²x = sec²x.' },
      {
        prompt: 'If cos θ = 5/13 in Quadrant IV, find sin θ.',
        answer: '−12/13',
        hint: 'Sine is negative in Quadrant IV.',
      },
      { prompt: 'Simplify sin²x · csc²x + cos²x · sec²x.', answer: '2', hint: 'Each product is a reciprocal pair.' },
    ],
    keywords: ['pythagorean', 'identity', 'sin²', 'cos²', 'tan²', 'sec²', 'csc²', 'cot²', 'unit circle', 'sine', 'cosine', 'quadrant'],
  },
  {
    id: 'sum-difference-identities',
    topic: 'trig',
    title: 'Sum & Difference Identities',
    minutes: 20,
    level: 'Core',
    summary: 'Expand sin(A ± B), cos(A ± B), and tan(A ± B) to find exact values.',
    formulas: [
      { label: 'Sine', expr: 'sin(A ± B) = sin A cos B ± cos A sin B' },
      { label: 'Cosine', expr: 'cos(A ± B) = cos A cos B ∓ sin A sin B' },
      { label: 'Tangent', expr: 'tan(A ± B) = (tan A ± tan B) / (1 ∓ tan A tan B)' },
    ],
    explanation: [
      'Sum and difference identities break an angle you don’t know into two angles you do — usually multiples of 30°, 45°, and 60°.',
      'Watch the signs: in the cosine formula the sign in the middle is the opposite of the sign inside the brackets.',
      'Reading the formula right-to-left is just as useful: sin 70° cos 20° + cos 70° sin 20° collapses to sin 90° = 1.',
    ],
    examples: [
      {
        problem: 'Find the exact value of sin 75°.',
        steps: [
          'sin 75° = sin(45° + 30°)',
          '= sin 45° cos 30° + cos 45° sin 30°',
          '= (√2/2)(√3/2) + (√2/2)(1/2)',
        ],
        answer: '(√6 + √2) / 4',
      },
      {
        problem: 'Find the exact value of cos 15°.',
        steps: ['cos 15° = cos(45° − 30°)', '= cos 45° cos 30° + sin 45° sin 30°', '= √6/4 + √2/4'],
        answer: '(√6 + √2) / 4',
      },
    ],
    practice: [
      { prompt: 'Evaluate cos 80° cos 20° + sin 80° sin 20°.', answer: '1/2', hint: 'This is cos(80° − 20°).' },
      { prompt: 'Find the exact value of tan 15°.', answer: '2 − √3', hint: 'Use tan(45° − 30°).' },
      { prompt: 'Simplify sin(x + π) .', answer: '−sin x', hint: 'cos π = −1 and sin π = 0.' },
    ],
    keywords: ['sum', 'difference', 'angle addition', 'sin(a+b)', 'cos(a+b)', 'tan(a+b)', 'exact value', '75°', '15°', 'sine', 'cosine', 'tangent'],
  },
  {
    id: 'double-half-angle',
    topic: 'trig',
    title: 'Double-Angle & Half-Angle Identities',
    minutes: 25,
    level: 'Applied',
    summary: 'Rewrite sin 2θ and cos 2θ three ways and solve equations with them.',
    formulas: [
      { label: 'Double sine', expr: 'sin 2θ = 2 sin θ cos θ' },
      { label: 'Double cosine', expr: 'cos 2θ = cos²θ − sin²θ = 2cos²θ − 1 = 1 − 2sin²θ' },
      { label: 'Half-angle sine', expr: 'sin(θ/2) = ±√((1 − cos θ) / 2)' },
      { label: 'Half-angle cosine', expr: 'cos(θ/2) = ±√((1 + cos θ) / 2)' },
    ],
    explanation: [
      'Set A = B = θ in the sum identities and the double-angle identities appear immediately.',
      'Cosine has three forms. Pick the one that matches the rest of your expression — all cosines, all sines, or both.',
      'Half-angle formulas come from solving the cos 2θ forms for sin²θ and cos²θ. The ± sign depends on the quadrant of θ/2.',
    ],
    examples: [
      {
        problem: 'If sin θ = 4/5 and cos θ = 3/5, find sin 2θ.',
        steps: ['sin 2θ = 2 sin θ cos θ', '= 2 · (4/5) · (3/5)'],
        answer: '24/25',
      },
      {
        problem: 'Solve cos 2x = cos x on [0, 2π).',
        steps: [
          '2cos²x − 1 = cos x',
          '2cos²x − cos x − 1 = 0',
          '(2cos x + 1)(cos x − 1) = 0',
          'cos x = −1/2 or cos x = 1',
        ],
        answer: 'x = 0, 2π/3, 4π/3',
      },
    ],
    practice: [
      { prompt: 'Simplify 2 sin 15° cos 15°.', answer: '1/2', hint: 'This is sin 30°.' },
      { prompt: 'Write cos 2x using only sin x.', answer: '1 − 2sin²x', hint: 'Replace cos²x with 1 − sin²x.' },
      { prompt: 'Find the exact value of cos 22.5°.', answer: '√(2 + √2) / 2', hint: 'Half of 45°; cosine is positive.' },
    ],
    keywords: ['double angle', 'half angle', 'sin 2θ', 'cos 2θ', '2 sin θ cos θ', 'trigonometric equation', 'sine', 'cosine', 'identity'],
  },
  {
    id: 'exponential-basics',
    topic: 'exp',
    title: 'Graphs of Exponential Functions',
    minutes: 15,
    level: 'Foundations',
    summary: 'Understand f(x) = a·bˣ: base, intercept, asymptote, and transformations.',
    formulas: [
      { label: 'General form', expr: 'f(x) = a · bˣ,  b > 0, b ≠ 1' },
      { label: 'Growth / decay', expr: 'b > 1 → growth;  0 < b < 1 → decay' },
      { label: 'Transformed', expr: 'f(x) = a · bˣ⁻ʰ + k   (asymptote y = k)' },
    ],
    explanation: [
      'In an exponential function the variable is in the exponent. Each step of 1 in x multiplies the output by the base b.',
      'The graph of y = bˣ always passes through (0, 1) and has a horizontal asymptote at y = 0.',
      'Shifting with h and k moves the graph; the asymptote moves to y = k and the y-intercept becomes a·b⁻ʰ + k.',
    ],
    examples: [
      {
        problem: 'Describe f(x) = 3 · 2ˣ.',
        steps: ['a = 3, so the y-intercept is (0, 3).', 'b = 2 > 1, so it is growth.', 'Asymptote: y = 0.'],
        answer: 'Growth, y-intercept 3, asymptote y = 0',
      },
      {
        problem: 'Find the asymptote and y-intercept of g(x) = 2ˣ − 5.',
        steps: ['k = −5, so the asymptote is y = −5.', 'g(0) = 2⁰ − 5 = 1 − 5'],
        answer: 'Asymptote y = −5, y-intercept (0, −4)',
      },
    ],
    practice: [
      { prompt: 'Is f(x) = 5 · (0.8)ˣ growth or decay?', answer: 'Decay', hint: 'Compare the base to 1.' },
      { prompt: 'What is the y-intercept of f(x) = 7 · 3ˣ?', answer: '7', hint: 'Evaluate at x = 0.' },
      { prompt: 'What is the asymptote of y = 4ˣ + 2?', answer: 'y = 2', hint: 'The vertical shift moves it.' },
    ],
    keywords: ['exponential', 'base', 'growth', 'decay', 'asymptote', 'y-intercept', 'bˣ', '2ˣ', 'graph', 'transformation'],
  },
  {
    id: 'growth-decay-e',
    topic: 'exp',
    title: 'Growth, Decay & the Number e',
    minutes: 20,
    level: 'Core',
    summary: 'Model compound interest, continuous growth, and half-life.',
    formulas: [
      { label: 'Compound interest', expr: 'A = P(1 + r/n)ⁿᵗ' },
      { label: 'Continuous growth', expr: 'A = Peʳᵗ' },
      { label: 'Half-life', expr: 'N = N₀ (1/2)ᵗ/ʰ' },
    ],
    explanation: [
      'Compounding n times per year at rate r multiplies the principal by (1 + r/n) each period.',
      'As n grows without bound, (1 + 1/n)ⁿ approaches e ≈ 2.71828. That limit gives continuous compounding, A = Peʳᵗ.',
      'Decay works the same way with a factor less than 1 — half-life h is the time for the quantity to halve.',
    ],
    examples: [
      {
        problem: '$1000 at 6% compounded monthly for 2 years.',
        steps: ['A = 1000(1 + 0.06/12)²⁴', '= 1000(1.005)²⁴', '≈ 1000 · 1.12716'],
        answer: '≈ $1127.16',
      },
      {
        problem: 'A 80 g sample has a half-life of 5 days. How much remains after 15 days?',
        steps: ['t/h = 15/5 = 3', 'N = 80 · (1/2)³ = 80/8'],
        answer: '10 g',
      },
    ],
    practice: [
      { prompt: '$500 grows continuously at 4% for 10 years. Find A to the nearest dollar.', answer: '$746', hint: '500·e^0.4' },
      { prompt: 'What is the decay factor per year for 12% decay?', answer: '0.88', hint: '1 − r' },
      { prompt: 'After two half-lives, what fraction remains?', answer: '1/4', hint: '(1/2)²' },
    ],
    keywords: ['compound interest', 'continuous', 'e', 'euler', 'half-life', 'decay', 'growth', 'principal', 'rate', 'pe^rt', 'exponential model'],
  },
  {
    id: 'solving-exponential-equations',
    topic: 'exp',
    title: 'Solving Exponential Equations',
    minutes: 25,
    level: 'Applied',
    summary: 'Match bases when you can, take logarithms when you can’t.',
    formulas: [
      { label: 'Equal bases', expr: 'bˣ = bʸ  ⇔  x = y' },
      { label: 'Take logs', expr: 'bˣ = c  ⇒  x = ln c / ln b' },
      { label: 'Exponent rules', expr: 'bᵐ · bⁿ = bᵐ⁺ⁿ,  (bᵐ)ⁿ = bᵐⁿ' },
    ],
    explanation: [
      'If both sides can be written with the same base, set the exponents equal. 8 = 2³ and 1/9 = 3⁻² are common rewrites.',
      'Otherwise, take the natural log of both sides and use the power law to bring the exponent down.',
      'Equations like e²ˣ − 5eˣ + 6 = 0 are quadratics in disguise: substitute u = eˣ.',
    ],
    examples: [
      {
        problem: 'Solve 4ˣ⁺¹ = 8ˣ.',
        steps: ['(2²)ˣ⁺¹ = (2³)ˣ', '2x + 2 = 3x'],
        answer: 'x = 2',
      },
      {
        problem: 'Solve 5ˣ = 20.',
        steps: ['ln 5ˣ = ln 20', 'x ln 5 = ln 20', 'x = ln 20 / ln 5'],
        answer: 'x ≈ 1.861',
      },
    ],
    practice: [
      { prompt: 'Solve 3ˣ = 81.', answer: 'x = 4', hint: '81 = 3⁴' },
      { prompt: 'Solve 2ˣ = 1/32.', answer: 'x = −5', hint: '1/32 = 2⁻⁵' },
      { prompt: 'Solve e²ˣ − 5eˣ + 6 = 0.', answer: 'x = ln 2 or x = ln 3', hint: 'Let u = eˣ.' },
    ],
    keywords: ['exponential equation', 'same base', 'solve', 'ln', 'natural log', 'exponent rules', 'substitution', 'bˣ', 'eˣ'],
  },
  {
    id: 'logarithm-definition',
    topic: 'log',
    title: 'Logarithms as Inverses',
    minutes: 15,
    level: 'Foundations',
    summary: 'Convert between exponential and logarithmic form and graph y = log_b x.',
    formulas: [
      { label: 'Definition', expr: 'log_b x = y  ⇔  bʸ = x' },
      { label: 'Special values', expr: 'log_b 1 = 0,  log_b b = 1' },
      { label: 'Inverse pair', expr: 'b^(log_b x) = x,  log_b(bˣ) = x' },
    ],
    explanation: [
      'A logarithm answers the question “what power of b gives x?” — so log₂ 8 = 3 because 2³ = 8.',
      'y = log_b x is the inverse of y = bˣ: its graph is the reflection across y = x, passes through (1, 0), and has a vertical asymptote at x = 0.',
      'The domain is x > 0. You cannot take the log of zero or a negative number.',
    ],
    examples: [
      { problem: 'Evaluate log₃ 81.', steps: ['3ʸ = 81', '81 = 3⁴'], answer: '4' },
      { problem: 'Write 10⁻² = 0.01 in log form.', steps: ['Base 10, exponent −2, result 0.01'], answer: 'log 0.01 = −2' },
    ],
    practice: [
      { prompt: 'Evaluate log₅ 125.', answer: '3', hint: '5³ = 125' },
      { prompt: 'Evaluate log₂ (1/16).', answer: '−4', hint: '2⁻⁴ = 1/16' },
      { prompt: 'What is the domain of y = log(x − 3)?', answer: 'x > 3', hint: 'The argument must be positive.' },
    ],
    keywords: ['logarithm', 'log', 'inverse', 'log_b', 'domain', 'vertical asymptote', 'exponential form', 'logarithmic form', 'base'],
  },
  {
    id: 'laws-of-logarithms',
    topic: 'log',
    title: 'Laws of Logarithms',
    minutes: 20,
    level: 'Core',
    summary: 'Expand and condense expressions with the product, quotient, and power laws.',
    formulas: [
      { label: 'Product law', expr: 'log_b(MN) = log_b M + log_b N' },
      { label: 'Quotient law', expr: 'log_b(M/N) = log_b M − log_b N' },
      { label: 'Power law', expr: 'log_b(Mᵖ) = p · log_b M' },
    ],
    explanation: [
      'Because logs are exponents, the exponent rules turn into log laws: multiplying adds exponents, so the log of a product is a sum.',
      'To expand, apply the quotient law first, then the product law, then bring powers down.',
      'There is no law for log(M + N). A very common error is writing log(M + N) = log M + log N.',
    ],
    examples: [
      {
        problem: 'Expand log(x³y / z²).',
        steps: ['= log(x³y) − log z²', '= log x³ + log y − log z²'],
        answer: '3 log x + log y − 2 log z',
      },
      {
        problem: 'Condense 2 ln a − ln b + ln c.',
        steps: ['= ln a² − ln b + ln c', '= ln(a² c / b)'],
        answer: 'ln(a²c / b)',
      },
    ],
    practice: [
      { prompt: 'Evaluate log₂ 4 + log₂ 8.', answer: '5', hint: 'log₂ 32' },
      { prompt: 'Expand ln(√x · y).', answer: '½ ln x + ln y', hint: '√x = x^½' },
      { prompt: 'Condense log 50 + log 2.', answer: '2', hint: 'log 100' },
    ],
    keywords: ['product law', 'quotient law', 'power law', 'laws of logarithms', 'expand', 'condense', 'log', 'ln', 'properties'],
  },
  {
    id: 'change-of-base-log-equations',
    topic: 'log',
    title: 'Change of Base & Log Equations',
    minutes: 25,
    level: 'Applied',
    summary: 'Evaluate any log on a calculator and solve logarithmic equations safely.',
    formulas: [
      { label: 'Change of base', expr: 'log_b x = log x / log b = ln x / ln b' },
      { label: 'One-to-one', expr: 'log_b M = log_b N  ⇔  M = N' },
      { label: 'Natural log', expr: 'ln x = log_e x' },
    ],
    explanation: [
      'Calculators only have log (base 10) and ln (base e). Change of base lets you evaluate any other base.',
      'To solve a log equation, condense to a single log on each side, then use the one-to-one property or rewrite in exponential form.',
      'Always check answers: any value that makes an original argument zero or negative is extraneous.',
    ],
    examples: [
      { problem: 'Evaluate log₇ 50.', steps: ['= ln 50 / ln 7', '≈ 3.912 / 1.946'], answer: '≈ 2.010' },
      {
        problem: 'Solve log₂ x + log₂(x − 2) = 3.',
        steps: ['log₂(x(x − 2)) = 3', 'x² − 2x = 8', '(x − 4)(x + 2) = 0', 'x = −2 is extraneous'],
        answer: 'x = 4',
      },
    ],
    practice: [
      { prompt: 'Solve log₃(2x + 1) = 2.', answer: 'x = 4', hint: '2x + 1 = 9' },
      { prompt: 'Solve ln x = 2.', answer: 'x = e²', hint: 'Exponentiate both sides.' },
      { prompt: 'Rewrite log₄ 10 using natural logs.', answer: 'ln 10 / ln 4', hint: 'Change of base.' },
    ],
    keywords: ['change of base', 'logarithmic equation', 'extraneous', 'ln', 'log', 'one-to-one', 'natural logarithm', 'solve', 'calculator'],
  },
]

export function getLesson(id: string) {
  return lessons.find((l) => l.id === id)
}

export function getTopic(id: TopicId) {
  return topics.find((t) => t.id === id)!
}
