import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' }
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const password = credentials.password as string

        // Verificar que la contraseña contenga "patataPocha"
        if (password.includes('patataPocha')) {
          return {
            id: credentials.username as string,
            name: credentials.username as string,
            email: `${credentials.username}@localhost`
          }
        }

        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/login'
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth
    }
  },
  trustHost: true
})
