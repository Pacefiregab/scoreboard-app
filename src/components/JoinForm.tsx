'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function JoinForm() {
  const [token, setToken] = useState('')
  const router = useRouter()

  function handleJoin() {
    const t = token.trim()
    if (t) router.push(`/game/${t}`)
  }

  return (
    <div className="flex gap-2 w-full">
      <Input
        placeholder="Code de partie"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
      />
      <Button variant="outline" onClick={handleJoin} disabled={!token.trim()}>
        Rejoindre
      </Button>
    </div>
  )
}
