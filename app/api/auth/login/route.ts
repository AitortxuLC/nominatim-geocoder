import { NextRequest, NextResponse } from 'next/server'

// La contraseña debe contener este string
const REQUIRED_PASSWORD_PHRASE = 'patataPocha'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validar que el usuario no esté vacío y que la contraseña contenga la frase requerida
    if (username && username.trim() !== '' && password && password.includes(REQUIRED_PASSWORD_PHRASE)) {
      // Crear una sesión simple
      const response = NextResponse.json({ success: true })

      // Establecer cookie de sesión
      response.cookies.set('auth-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { success: false, message: 'Credenciales incorrectas.' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
