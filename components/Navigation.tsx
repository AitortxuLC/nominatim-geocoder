'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-[#ed6103]">
                Nominatim Geocoder
              </div>
            </Link>

            <div className="flex gap-4">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-[#ed6103] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Geocoder
              </Link>

              <Link
                href="/aws-nominatim"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/aws-nominatim')
                    ? 'bg-[#ed6103] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Aws-Nominatim
              </Link>

              <Link
                href="/geos-mapper"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/geos-mapper')
                    ? 'bg-[#ed6103] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Geos Mapper
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  )
}
