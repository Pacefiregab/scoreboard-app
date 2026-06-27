import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.next()

  try {
    const authHeader = request.headers.get('authorization') ?? ''
    if (authHeader.startsWith('Basic ')) {
      const decoded = atob(authHeader.slice(6))
      const password = decoded.slice(decoded.indexOf(':') + 1)
      if (password === adminPassword) return NextResponse.next()
    }
  } catch {}

  return new NextResponse('Accès non autorisé', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  })
}

export const config = {
  matcher: ['/admin/:path*'],
}
