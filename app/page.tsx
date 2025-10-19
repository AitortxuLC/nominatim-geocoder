import { NominatimGeocoder } from '@/components/NominatimGeocoder'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8 px-4">
        <NominatimGeocoder />
      </div>
    </main>
  )
}
