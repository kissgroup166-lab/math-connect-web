-- Course content the admin edits from the dashboard: topics, lessons, quiz questions, and
-- Find the Error game items. Everyone (signed in or not) reads published rows; only the
-- admin writes. Seeded below from the content that used to live in src/data.

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- The site covers exactly these three topics, so topics can be renamed but not added.
create table public.topics (
  id text primary key check (id in ('trig', 'exp', 'log')),
  name text not null check (char_length(name) between 1 and 80),
  short text not null check (char_length(short) between 1 and 30),
  blurb text not null default '' check (char_length(blurb) <= 300),
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 80),
  topic_id text not null references public.topics (id),
  title text not null check (char_length(title) between 1 and 120),
  minutes int not null default 10 check (minutes between 1 and 240),
  level text not null default 'Core' check (level in ('Foundations', 'Core', 'Applied')),
  summary text not null default '' check (char_length(summary) <= 500),
  formulas jsonb not null default '[]' check (jsonb_typeof(formulas) = 'array'),
  explanation jsonb not null default '[]' check (jsonb_typeof(explanation) = 'array'),
  examples jsonb not null default '[]' check (jsonb_typeof(examples) = 'array'),
  practice jsonb not null default '[]' check (jsonb_typeof(practice) = 'array'),
  keywords jsonb not null default '[]' check (jsonb_typeof(keywords) = 'array'),
  sort int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.questions (
  id text primary key default gen_random_uuid()::text,
  lesson_id text not null references public.lessons (id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 500),
  choices jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 2 and 6),
  answer int not null check (answer >= 0),
  explanation text not null default '' check (char_length(explanation) <= 1000),
  sort int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  check (answer < jsonb_array_length(choices))
);

create table public.error_items (
  id text primary key default gen_random_uuid()::text,
  topic_id text references public.topics (id),
  problem text not null check (char_length(problem) between 1 and 300),
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 2 and 8),
  wrong int not null check (wrong >= 0),
  why text not null check (char_length(why) between 1 and 1000),
  sort int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  check (wrong < jsonb_array_length(steps))
);

create index questions_lesson_idx on public.questions (lesson_id);

create trigger topics_touch before update on public.topics for each row execute function public.touch_updated_at();
create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger error_items_touch before update on public.error_items for each row execute function public.touch_updated_at();

alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.error_items enable row level security;

create policy "Anyone reads topics" on public.topics for select to anon, authenticated using (true);
create policy "Admin updates topics" on public.topics for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Anyone reads published lessons, admin reads all" on public.lessons
  for select to anon, authenticated using (published or public.is_admin());
create policy "Admin writes lessons" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Anyone reads published questions, admin reads all" on public.questions
  for select to anon, authenticated using (published or public.is_admin());
create policy "Admin writes questions" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Anyone reads published error items, admin reads all" on public.error_items
  for select to anon, authenticated using (published or public.is_admin());
create policy "Admin writes error items" on public.error_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed ----------------------------------------------------------------------

insert into public.topics (id, name, short, blurb, sort) values
  ('trig', 'Trigonometric Identities', 'Trig', 'Pythagorean, angle-sum, and double-angle identities — and how to prove them.', 0),
  ('exp', 'Exponential Functions', 'Exponential', 'Growth, decay, the number e, and solving exponential equations.', 1),
  ('log', 'Logarithmic Functions', 'Logarithms', 'Logs as inverses, the laws of logarithms, and change of base.', 2)
on conflict (id) do nothing;

insert into public.lessons (id, topic_id, title, minutes, level, summary, formulas, explanation, examples, practice, keywords, sort) values
  ('pythagorean-identities', 'trig', 'Pythagorean Identities', 15, 'Foundations', 'Derive sin²θ + cos²θ = 1 from the unit circle and use its two cousins.',
   '[{"label":"Fundamental","expr":"sin²θ + cos²θ = 1"},{"label":"Tangent form","expr":"1 + tan²θ = sec²θ"},{"label":"Cotangent form","expr":"1 + cot²θ = csc²θ"}]'::jsonb,
   '["On the unit circle a point at angle θ has coordinates (cos θ, sin θ). Because the radius is 1, the Pythagorean theorem gives x² + y² = 1, which is exactly sin²θ + cos²θ = 1.","Divide every term by cos²θ to get 1 + tan²θ = sec²θ. Divide by sin²θ instead to get 1 + cot²θ = csc²θ.","These identities let you swap between functions — for example, replacing sin²θ with 1 − cos²θ to get an expression in a single function."]'::jsonb,
   '[{"problem":"If sin θ = 3/5 and θ is in Quadrant II, find cos θ.","steps":["cos²θ = 1 − sin²θ = 1 − 9/25 = 16/25","cos θ = ±4/5","Cosine is negative in Quadrant II."],"answer":"cos θ = −4/5"},{"problem":"Simplify (1 − cos²x) / sin x.","steps":["1 − cos²x = sin²x","sin²x / sin x = sin x"],"answer":"sin x"}]'::jsonb,
   '[{"prompt":"Simplify sec²x − tan²x.","answer":"1","hint":"Rearrange 1 + tan²x = sec²x."},{"prompt":"If cos θ = 5/13 in Quadrant IV, find sin θ.","answer":"−12/13","hint":"Sine is negative in Quadrant IV."},{"prompt":"Simplify sin²x · csc²x + cos²x · sec²x.","answer":"2","hint":"Each product is a reciprocal pair."}]'::jsonb,
   '["pythagorean","identity","sin²","cos²","tan²","sec²","csc²","cot²","unit circle","sine","cosine","quadrant"]'::jsonb, 0),
  ('sum-difference-identities', 'trig', 'Sum & Difference Identities', 20, 'Core', 'Expand sin(A ± B), cos(A ± B), and tan(A ± B) to find exact values.',
   '[{"label":"Sine","expr":"sin(A ± B) = sin A cos B ± cos A sin B"},{"label":"Cosine","expr":"cos(A ± B) = cos A cos B ∓ sin A sin B"},{"label":"Tangent","expr":"tan(A ± B) = (tan A ± tan B) / (1 ∓ tan A tan B)"}]'::jsonb,
   '["Sum and difference identities break an angle you don’t know into two angles you do — usually multiples of 30°, 45°, and 60°.","Watch the signs: in the cosine formula the sign in the middle is the opposite of the sign inside the brackets.","Reading the formula right-to-left is just as useful: sin 70° cos 20° + cos 70° sin 20° collapses to sin 90° = 1."]'::jsonb,
   '[{"problem":"Find the exact value of sin 75°.","steps":["sin 75° = sin(45° + 30°)","= sin 45° cos 30° + cos 45° sin 30°","= (√2/2)(√3/2) + (√2/2)(1/2)"],"answer":"(√6 + √2) / 4"},{"problem":"Find the exact value of cos 15°.","steps":["cos 15° = cos(45° − 30°)","= cos 45° cos 30° + sin 45° sin 30°","= √6/4 + √2/4"],"answer":"(√6 + √2) / 4"}]'::jsonb,
   '[{"prompt":"Evaluate cos 80° cos 20° + sin 80° sin 20°.","answer":"1/2","hint":"This is cos(80° − 20°)."},{"prompt":"Find the exact value of tan 15°.","answer":"2 − √3","hint":"Use tan(45° − 30°)."},{"prompt":"Simplify sin(x + π) .","answer":"−sin x","hint":"cos π = −1 and sin π = 0."}]'::jsonb,
   '["sum","difference","angle addition","sin(a+b)","cos(a+b)","tan(a+b)","exact value","75°","15°","sine","cosine","tangent"]'::jsonb, 1),
  ('double-half-angle', 'trig', 'Double-Angle & Half-Angle Identities', 25, 'Applied', 'Rewrite sin 2θ and cos 2θ three ways and solve equations with them.',
   '[{"label":"Double sine","expr":"sin 2θ = 2 sin θ cos θ"},{"label":"Double cosine","expr":"cos 2θ = cos²θ − sin²θ = 2cos²θ − 1 = 1 − 2sin²θ"},{"label":"Half-angle sine","expr":"sin(θ/2) = ±√((1 − cos θ) / 2)"},{"label":"Half-angle cosine","expr":"cos(θ/2) = ±√((1 + cos θ) / 2)"}]'::jsonb,
   '["Set A = B = θ in the sum identities and the double-angle identities appear immediately.","Cosine has three forms. Pick the one that matches the rest of your expression — all cosines, all sines, or both.","Half-angle formulas come from solving the cos 2θ forms for sin²θ and cos²θ. The ± sign depends on the quadrant of θ/2."]'::jsonb,
   '[{"problem":"If sin θ = 4/5 and cos θ = 3/5, find sin 2θ.","steps":["sin 2θ = 2 sin θ cos θ","= 2 · (4/5) · (3/5)"],"answer":"24/25"},{"problem":"Solve cos 2x = cos x on [0, 2π).","steps":["2cos²x − 1 = cos x","2cos²x − cos x − 1 = 0","(2cos x + 1)(cos x − 1) = 0","cos x = −1/2 or cos x = 1"],"answer":"x = 0, 2π/3, 4π/3"}]'::jsonb,
   '[{"prompt":"Simplify 2 sin 15° cos 15°.","answer":"1/2","hint":"This is sin 30°."},{"prompt":"Write cos 2x using only sin x.","answer":"1 − 2sin²x","hint":"Replace cos²x with 1 − sin²x."},{"prompt":"Find the exact value of cos 22.5°.","answer":"√(2 + √2) / 2","hint":"Half of 45°; cosine is positive."}]'::jsonb,
   '["double angle","half angle","sin 2θ","cos 2θ","2 sin θ cos θ","trigonometric equation","sine","cosine","identity"]'::jsonb, 2),
  ('exponential-basics', 'exp', 'Graphs of Exponential Functions', 15, 'Foundations', 'Understand f(x) = a·bˣ: base, intercept, asymptote, and transformations.',
   '[{"label":"General form","expr":"f(x) = a · bˣ,  b > 0, b ≠ 1"},{"label":"Growth / decay","expr":"b > 1 → growth;  0 < b < 1 → decay"},{"label":"Transformed","expr":"f(x) = a · bˣ⁻ʰ + k   (asymptote y = k)"}]'::jsonb,
   '["In an exponential function the variable is in the exponent. Each step of 1 in x multiplies the output by the base b.","The graph of y = bˣ always passes through (0, 1) and has a horizontal asymptote at y = 0.","Shifting with h and k moves the graph; the asymptote moves to y = k and the y-intercept becomes a·b⁻ʰ + k."]'::jsonb,
   '[{"problem":"Describe f(x) = 3 · 2ˣ.","steps":["a = 3, so the y-intercept is (0, 3).","b = 2 > 1, so it is growth.","Asymptote: y = 0."],"answer":"Growth, y-intercept 3, asymptote y = 0"},{"problem":"Find the asymptote and y-intercept of g(x) = 2ˣ − 5.","steps":["k = −5, so the asymptote is y = −5.","g(0) = 2⁰ − 5 = 1 − 5"],"answer":"Asymptote y = −5, y-intercept (0, −4)"}]'::jsonb,
   '[{"prompt":"Is f(x) = 5 · (0.8)ˣ growth or decay?","answer":"Decay","hint":"Compare the base to 1."},{"prompt":"What is the y-intercept of f(x) = 7 · 3ˣ?","answer":"7","hint":"Evaluate at x = 0."},{"prompt":"What is the asymptote of y = 4ˣ + 2?","answer":"y = 2","hint":"The vertical shift moves it."}]'::jsonb,
   '["exponential","base","growth","decay","asymptote","y-intercept","bˣ","2ˣ","graph","transformation"]'::jsonb, 3),
  ('growth-decay-e', 'exp', 'Growth, Decay & the Number e', 20, 'Core', 'Model compound interest, continuous growth, and half-life.',
   '[{"label":"Compound interest","expr":"A = P(1 + r/n)ⁿᵗ"},{"label":"Continuous growth","expr":"A = Peʳᵗ"},{"label":"Half-life","expr":"N = N₀ (1/2)ᵗ/ʰ"}]'::jsonb,
   '["Compounding n times per year at rate r multiplies the principal by (1 + r/n) each period.","As n grows without bound, (1 + 1/n)ⁿ approaches e ≈ 2.71828. That limit gives continuous compounding, A = Peʳᵗ.","Decay works the same way with a factor less than 1 — half-life h is the time for the quantity to halve."]'::jsonb,
   '[{"problem":"$1000 at 6% compounded monthly for 2 years.","steps":["A = 1000(1 + 0.06/12)²⁴","= 1000(1.005)²⁴","≈ 1000 · 1.12716"],"answer":"≈ $1127.16"},{"problem":"A 80 g sample has a half-life of 5 days. How much remains after 15 days?","steps":["t/h = 15/5 = 3","N = 80 · (1/2)³ = 80/8"],"answer":"10 g"}]'::jsonb,
   '[{"prompt":"$500 grows continuously at 4% for 10 years. Find A to the nearest dollar.","answer":"$746","hint":"500·e^0.4"},{"prompt":"What is the decay factor per year for 12% decay?","answer":"0.88","hint":"1 − r"},{"prompt":"After two half-lives, what fraction remains?","answer":"1/4","hint":"(1/2)²"}]'::jsonb,
   '["compound interest","continuous","e","euler","half-life","decay","growth","principal","rate","pe^rt","exponential model"]'::jsonb, 4),
  ('solving-exponential-equations', 'exp', 'Solving Exponential Equations', 25, 'Applied', 'Match bases when you can, take logarithms when you can’t.',
   '[{"label":"Equal bases","expr":"bˣ = bʸ  ⇔  x = y"},{"label":"Take logs","expr":"bˣ = c  ⇒  x = ln c / ln b"},{"label":"Exponent rules","expr":"bᵐ · bⁿ = bᵐ⁺ⁿ,  (bᵐ)ⁿ = bᵐⁿ"}]'::jsonb,
   '["If both sides can be written with the same base, set the exponents equal. 8 = 2³ and 1/9 = 3⁻² are common rewrites.","Otherwise, take the natural log of both sides and use the power law to bring the exponent down.","Equations like e²ˣ − 5eˣ + 6 = 0 are quadratics in disguise: substitute u = eˣ."]'::jsonb,
   '[{"problem":"Solve 4ˣ⁺¹ = 8ˣ.","steps":["(2²)ˣ⁺¹ = (2³)ˣ","2x + 2 = 3x"],"answer":"x = 2"},{"problem":"Solve 5ˣ = 20.","steps":["ln 5ˣ = ln 20","x ln 5 = ln 20","x = ln 20 / ln 5"],"answer":"x ≈ 1.861"}]'::jsonb,
   '[{"prompt":"Solve 3ˣ = 81.","answer":"x = 4","hint":"81 = 3⁴"},{"prompt":"Solve 2ˣ = 1/32.","answer":"x = −5","hint":"1/32 = 2⁻⁵"},{"prompt":"Solve e²ˣ − 5eˣ + 6 = 0.","answer":"x = ln 2 or x = ln 3","hint":"Let u = eˣ."}]'::jsonb,
   '["exponential equation","same base","solve","ln","natural log","exponent rules","substitution","bˣ","eˣ"]'::jsonb, 5),
  ('logarithm-definition', 'log', 'Logarithms as Inverses', 15, 'Foundations', 'Convert between exponential and logarithmic form and graph y = log_b x.',
   '[{"label":"Definition","expr":"log_b x = y  ⇔  bʸ = x"},{"label":"Special values","expr":"log_b 1 = 0,  log_b b = 1"},{"label":"Inverse pair","expr":"b^(log_b x) = x,  log_b(bˣ) = x"}]'::jsonb,
   '["A logarithm answers the question “what power of b gives x?” — so log₂ 8 = 3 because 2³ = 8.","y = log_b x is the inverse of y = bˣ: its graph is the reflection across y = x, passes through (1, 0), and has a vertical asymptote at x = 0.","The domain is x > 0. You cannot take the log of zero or a negative number."]'::jsonb,
   '[{"problem":"Evaluate log₃ 81.","steps":["3ʸ = 81","81 = 3⁴"],"answer":"4"},{"problem":"Write 10⁻² = 0.01 in log form.","steps":["Base 10, exponent −2, result 0.01"],"answer":"log 0.01 = −2"}]'::jsonb,
   '[{"prompt":"Evaluate log₅ 125.","answer":"3","hint":"5³ = 125"},{"prompt":"Evaluate log₂ (1/16).","answer":"−4","hint":"2⁻⁴ = 1/16"},{"prompt":"What is the domain of y = log(x − 3)?","answer":"x > 3","hint":"The argument must be positive."}]'::jsonb,
   '["logarithm","log","inverse","log_b","domain","vertical asymptote","exponential form","logarithmic form","base"]'::jsonb, 6),
  ('laws-of-logarithms', 'log', 'Laws of Logarithms', 20, 'Core', 'Expand and condense expressions with the product, quotient, and power laws.',
   '[{"label":"Product law","expr":"log_b(MN) = log_b M + log_b N"},{"label":"Quotient law","expr":"log_b(M/N) = log_b M − log_b N"},{"label":"Power law","expr":"log_b(Mᵖ) = p · log_b M"}]'::jsonb,
   '["Because logs are exponents, the exponent rules turn into log laws: multiplying adds exponents, so the log of a product is a sum.","To expand, apply the quotient law first, then the product law, then bring powers down.","There is no law for log(M + N). A very common error is writing log(M + N) = log M + log N."]'::jsonb,
   '[{"problem":"Expand log(x³y / z²).","steps":["= log(x³y) − log z²","= log x³ + log y − log z²"],"answer":"3 log x + log y − 2 log z"},{"problem":"Condense 2 ln a − ln b + ln c.","steps":["= ln a² − ln b + ln c","= ln(a² c / b)"],"answer":"ln(a²c / b)"}]'::jsonb,
   '[{"prompt":"Evaluate log₂ 4 + log₂ 8.","answer":"5","hint":"log₂ 32"},{"prompt":"Expand ln(√x · y).","answer":"½ ln x + ln y","hint":"√x = x^½"},{"prompt":"Condense log 50 + log 2.","answer":"2","hint":"log 100"}]'::jsonb,
   '["product law","quotient law","power law","laws of logarithms","expand","condense","log","ln","properties"]'::jsonb, 7),
  ('change-of-base-log-equations', 'log', 'Change of Base & Log Equations', 25, 'Applied', 'Evaluate any log on a calculator and solve logarithmic equations safely.',
   '[{"label":"Change of base","expr":"log_b x = log x / log b = ln x / ln b"},{"label":"One-to-one","expr":"log_b M = log_b N  ⇔  M = N"},{"label":"Natural log","expr":"ln x = log_e x"}]'::jsonb,
   '["Calculators only have log (base 10) and ln (base e). Change of base lets you evaluate any other base.","To solve a log equation, condense to a single log on each side, then use the one-to-one property or rewrite in exponential form.","Always check answers: any value that makes an original argument zero or negative is extraneous."]'::jsonb,
   '[{"problem":"Evaluate log₇ 50.","steps":["= ln 50 / ln 7","≈ 3.912 / 1.946"],"answer":"≈ 2.010"},{"problem":"Solve log₂ x + log₂(x − 2) = 3.","steps":["log₂(x(x − 2)) = 3","x² − 2x = 8","(x − 4)(x + 2) = 0","x = −2 is extraneous"],"answer":"x = 4"}]'::jsonb,
   '[{"prompt":"Solve log₃(2x + 1) = 2.","answer":"x = 4","hint":"2x + 1 = 9"},{"prompt":"Solve ln x = 2.","answer":"x = e²","hint":"Exponentiate both sides."},{"prompt":"Rewrite log₄ 10 using natural logs.","answer":"ln 10 / ln 4","hint":"Change of base."}]'::jsonb,
   '["change of base","logarithmic equation","extraneous","ln","log","one-to-one","natural logarithm","solve","calculator"]'::jsonb, 8)
on conflict (id) do nothing;

insert into public.questions (id, lesson_id, prompt, choices, answer, explanation, sort) values
  ('t1', 'pythagorean-identities', 'sin²θ + cos²θ equals…', '["0","1","tan²θ","2"]'::jsonb, 1, 'This is the fundamental Pythagorean identity from the unit circle.', 0),
  ('t2', 'pythagorean-identities', 'Which is equivalent to sec²x − 1?', '["tan²x","cot²x","csc²x","sin²x"]'::jsonb, 0, '1 + tan²x = sec²x, so sec²x − 1 = tan²x.', 1),
  ('t3', 'pythagorean-identities', 'If cos θ = 3/5 in Quadrant I, sin θ =', '["3/4","4/5","−4/5","5/4"]'::jsonb, 1, 'sin²θ = 1 − 9/25 = 16/25 and sine is positive in QI.', 2),
  ('t4', 'pythagorean-identities', 'Simplify csc²x − cot²x.', '["0","−1","1","sec²x"]'::jsonb, 2, '1 + cot²x = csc²x rearranges to csc²x − cot²x = 1.', 3),
  ('t5', 'sum-difference-identities', 'sin(A + B) =', '["sin A + sin B","sin A cos B + cos A sin B","cos A cos B − sin A sin B","sin A sin B + cos A cos B"]'::jsonb, 1, 'The sine sum identity mixes sine and cosine.', 4),
  ('t6', 'sum-difference-identities', 'cos 75° cos 15° − sin 75° sin 15° =', '["1","1/2","0","√3/2"]'::jsonb, 2, 'This is cos(75° + 15°) = cos 90° = 0.', 5),
  ('t7', 'sum-difference-identities', 'The exact value of sin 15° is', '["(√6 − √2)/4","(√6 + √2)/4","√3/2","1/4"]'::jsonb, 0, 'sin(45° − 30°) = √2/2·√3/2 − √2/2·1/2.', 6),
  ('t8', 'double-half-angle', 'sin 2θ =', '["2 sin θ","sin²θ","2 sin θ cos θ","cos²θ − sin²θ"]'::jsonb, 2, 'Set A = B = θ in the sine sum identity.', 7),
  ('t9', 'double-half-angle', 'Which is NOT a form of cos 2θ?', '["cos²θ − sin²θ","2cos²θ − 1","1 − 2sin²θ","2 sin θ cos θ"]'::jsonb, 3, '2 sin θ cos θ is sin 2θ.', 8),
  ('t10', 'double-half-angle', 'If sin θ = 3/5 and cos θ = 4/5, cos 2θ =', '["7/25","24/25","1/5","−7/25"]'::jsonb, 0, 'cos²θ − sin²θ = 16/25 − 9/25 = 7/25.', 9),
  ('e1', 'exponential-basics', 'f(x) = 2 · (0.5)ˣ represents', '["Growth","Decay","A line","A parabola"]'::jsonb, 1, 'The base 0.5 is between 0 and 1.', 10),
  ('e2', 'exponential-basics', 'The horizontal asymptote of y = 3ˣ − 4 is', '["y = 3","y = 0","y = −4","x = −4"]'::jsonb, 2, 'The vertical shift k = −4 moves the asymptote.', 11),
  ('e3', 'exponential-basics', 'The y-intercept of f(x) = 6 · 5ˣ is', '["5","6","30","1"]'::jsonb, 1, 'f(0) = 6 · 1 = 6.', 12),
  ('e4', 'growth-decay-e', 'e is approximately', '["2.718","3.142","1.618","2.236"]'::jsonb, 0, 'e = lim (1 + 1/n)ⁿ ≈ 2.71828.', 13),
  ('e5', 'growth-decay-e', 'The continuous growth formula is', '["A = P(1 + r)ᵗ","A = Peʳᵗ","A = Prt","A = P/eʳᵗ"]'::jsonb, 1, 'Continuous compounding uses base e.', 14),
  ('e6', 'growth-decay-e', 'A substance with half-life 3 h: what fraction remains after 9 h?', '["1/3","1/8","1/9","1/6"]'::jsonb, 1, '9/3 = 3 half-lives, (1/2)³ = 1/8.', 15),
  ('e7', 'growth-decay-e', 'Annual decay of 15% has decay factor', '["0.15","1.15","0.85","−0.15"]'::jsonb, 2, 'Decay factor = 1 − 0.15.', 16),
  ('e8', 'solving-exponential-equations', 'Solve 2ˣ = 64.', '["5","6","8","32"]'::jsonb, 1, '64 = 2⁶.', 17),
  ('e9', 'solving-exponential-equations', 'Solve 9ˣ = 27.', '["3","2/3","3/2","1/3"]'::jsonb, 2, '3²ˣ = 3³ so 2x = 3.', 18),
  ('e10', 'solving-exponential-equations', 'The solution of eˣ = 10 is', '["10/e","log 10","ln 10","e¹⁰"]'::jsonb, 2, 'Take the natural log of both sides.', 19),
  ('l1', 'logarithm-definition', 'log₂ 32 =', '["4","5","16","6"]'::jsonb, 1, '2⁵ = 32.', 20),
  ('l2', 'logarithm-definition', 'log_b 1 equals', '["1","b","0","undefined"]'::jsonb, 2, 'b⁰ = 1 for every valid base.', 21),
  ('l3', 'logarithm-definition', 'The domain of y = ln x is', '["All reals","x ≥ 0","x > 0","x ≠ 0"]'::jsonb, 2, 'Logs are only defined for positive arguments.', 22),
  ('l4', 'logarithm-definition', 'log 0.001 =', '["−3","3","−2","0.001"]'::jsonb, 0, '10⁻³ = 0.001.', 23),
  ('l5', 'laws-of-logarithms', 'log(MN) =', '["log M · log N","log M + log N","log M − log N","N log M"]'::jsonb, 1, 'Product law: multiplying inside adds logs.', 24),
  ('l6', 'laws-of-logarithms', 'ln(x⁴) =', '["4 + ln x","(ln x)⁴","4 ln x","ln 4x"]'::jsonb, 2, 'Power law brings the exponent down.', 25),
  ('l7', 'laws-of-logarithms', 'log₃ 54 − log₃ 2 =', '["3","27","52","2"]'::jsonb, 0, 'log₃(54/2) = log₃ 27 = 3.', 26),
  ('l8', 'change-of-base-log-equations', 'log₅ 20 equals', '["ln 5 / ln 20","ln 20 / ln 5","ln 4","20/5"]'::jsonb, 1, 'Change of base: ln x / ln b.', 27),
  ('l9', 'change-of-base-log-equations', 'Solve log₂(x + 3) = 4.', '["1","13","16","5"]'::jsonb, 1, 'x + 3 = 2⁴ = 16.', 28),
  ('l10', 'change-of-base-log-equations', 'Solving log x + log(x − 3) = 1 gives', '["x = 5 only","x = −2 only","x = 5 or −2","x = 10"]'::jsonb, 0, 'x(x − 3) = 10 gives 5 or −2, but −2 is extraneous.', 29)
on conflict (id) do nothing;

insert into public.error_items (id, topic_id, problem, steps, wrong, why, sort) values
  ('fe1', 'log', 'Expand log(x + y)·z', '["log((x + y)z)","= log(x + y) + log z","= log x + log y + log z"]'::jsonb, 2, 'There is no law for log(x + y). It cannot be split into log x + log y.', 0),
  ('fe2', 'exp', 'Solve 2ˣ = 32', '["2ˣ = 2⁵","x = 5","Check: 2⁵ = 25 ✓"]'::jsonb, 2, '2⁵ = 32, not 25. Powers are not multiplication.', 1),
  ('fe3', 'trig', 'Find cos θ if sin θ = 3/5, θ in QII', '["cos²θ = 1 − 9/25","cos²θ = 16/25","cos θ = 4/5"]'::jsonb, 2, 'Cosine is negative in Quadrant II, so cos θ = −4/5.', 2),
  ('fe4', 'trig', 'Simplify sin 2x', '["sin 2x = sin(x + x)","= sin x cos x + cos x sin x","= 2 sin x"]'::jsonb, 2, 'The sum gives 2 sin x cos x. The cos x factor was dropped.', 3),
  ('fe5', 'log', 'Solve log₂ x + log₂(x − 2) = 3', '["log₂(x(x − 2)) = 3","x² − 2x = 8","x = 4 or x = −2, both valid"]'::jsonb, 2, 'x = −2 makes log₂ x undefined, so it is extraneous. Only x = 4 works.', 4),
  ('fe6', 'log', 'Evaluate ln(e³ · e²)', '["= ln(e⁶)","= 6"]'::jsonb, 0, 'e³ · e² = e⁵. Multiplying powers adds exponents, it does not multiply them.', 5),
  ('fe7', 'exp', 'Continuous growth: $200 at 5% for 4 years', '["A = Peʳᵗ","A = 200e^(5 · 4)","A ≈ 200 · 1.2214 ≈ $244.28"]'::jsonb, 1, 'The rate must be a decimal: r = 0.05, so the exponent is 0.05 · 4 = 0.2.', 6),
  ('fe8', 'trig', 'Simplify 1 − 2 sin²θ', '["1 − 2 sin²θ = cos 2θ","So 1 − 2 sin²θ = sin 2θ"]'::jsonb, 1, '1 − 2 sin²θ is one of the forms of cos 2θ, not sin 2θ.', 7)
on conflict (id) do nothing;

-- A lesson with uploaded PDFs can be hidden but not deleted. NOT VALID skips checking
-- rows from before this migration; new uploads must name an existing lesson.
alter table public.submissions
  add constraint submissions_lesson_fk foreign key (lesson_id) references public.lessons (id) on delete restrict not valid;
