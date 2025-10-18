import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const country = searchParams.get('country') || 'id'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=${country}&format=jsonv2`
    console.log('[NOMINATIM SEARCH] Request URL:', nominatimUrl)

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Nominatim-Geocoder-App/1.0 (contact@yourdomain.com)',
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://nominatim-geocoder.vercel.app'
      }
    })
    console.log('[NOMINATIM SEARCH] Response status:', response.status)

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`)
    }

    const data = await response.json()
    console.log('[NOMINATIM SEARCH] Response data length:', data.length)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching from Nominatim:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Nominatim API' },
      { status: 500 }
    )
  }
}
