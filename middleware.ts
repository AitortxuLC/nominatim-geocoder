import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  if (pathname.startsWith('/login') ||
      pathname.startsWith('/api/auth/login') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Verificar si hay cookie de autenticación
  const authToken = request.cookies.get('auth-token')

  if (!authToken || authToken.value !== 'authenticated') {
    // Redirigir al login si no está autenticado
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
}
