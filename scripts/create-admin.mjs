// Creates (or resets) the single admin account for ADMIN_EMAIL.
// Run with: npm run admin:create   (reads .env)
// This is the only code that uses the service-role key; the app itself never does.
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Site Owner' } = process.env

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD })) {
  if (!v) {
    console.error(`Missing ${k} in .env`)
    process.exit(1)
  }
}
if (ADMIN_PASSWORD.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const email = ADMIN_EMAIL.trim().toLowerCase()

async function findUser() {
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email)
    if (hit || data.users.length < 200) return hit
  }
}

let user = await findUser()
if (user) {
  const { error } = await sb.auth.admin.updateUserById(user.id, { password: ADMIN_PASSWORD, email_confirm: true })
  if (error) throw error
  console.log(`Updated password for existing user ${email}`)
} else {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  })
  if (error) throw error
  user = data.user
  console.log(`Created user ${email}`)
}

// Exactly one admin: demote anyone else, then promote the owner.
const demote = await sb.from('profiles').update({ role: 'student' }).eq('role', 'admin').neq('id', user.id)
if (demote.error) throw demote.error
const promote = await sb.from('profiles').update({ role: 'admin', full_name: ADMIN_NAME }).eq('id', user.id)
if (promote.error) throw promote.error

console.log(`${email} is now the admin.`)
