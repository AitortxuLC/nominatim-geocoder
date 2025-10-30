import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === '/login'

  // Si no está logueado y no está en la página de login, redirigir a login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si está logueado y trata de acceder a login, redirigir a home
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|data).*)']
}
