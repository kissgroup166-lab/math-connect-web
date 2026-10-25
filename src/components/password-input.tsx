import { useState } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { passwordRules } from '@/lib/password'
import { cn } from '@/lib/utils'

export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

// Live checklist under a new-password field; each rule ticks as the user types.
export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} className="space-y-1 text-xs" aria-label="Password requirements">
      {passwordRules.map((rule) => {
        const met = rule.test(password)
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 transition-colors motion-reduce:transition-none',
              met ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {met ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
            {rule.label}
            <span className="sr-only">{met ? '(done)' : '(missing)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
