import { NominatimGeocoder } from '@/components/NominatimGeocoder'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Nominatim Geocoder</h1>
          <p className="text-gray-600 mt-2">Herramienta de geocodificación con Nominatim OSM</p>
        </div>
        <NominatimGeocoder />
      </div>
    </main>
  )
}
