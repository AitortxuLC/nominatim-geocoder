'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Importación dinámica de componentes de Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
)

interface GeoRow {
  col0: string // id
  col1: string // nombre
  col10: string // ID OSM original
  'NUEVO MAPEO OSM': string // Nuevo mapeo OSM
  _confirmationNote?: string
  [key: string]: string | undefined
}

interface ComparisonMapModalProps {
  isOpen: boolean
  row: GeoRow | null
  onClose: () => void
  onConfirm: (note: string) => void
}

interface NominatimData {
  osmId: string
  geometry: {
    type: string
    coordinates: any
  }
  properties?: {
    display_name?: string
    osm_type?: string
    osm_id?: number
  }
}

const COLORS = [
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
]

export function ComparisonMapModal({ isOpen, row, onClose, onConfirm }: ComparisonMapModalProps) {
  const [originalDataList, setOriginalDataList] = useState<NominatimData[]>([])
  const [newDataList, setNewDataList] = useState<NominatimData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (isOpen && row) {
      setNote(row._confirmationNote || '')
      loadGeometries()
    }
  }, [isOpen, row])

  const parseMultipleOsmIds = (osmIdString: string): string[] => {
    if (!osmIdString || osmIdString.trim() === '' || osmIdString === '#N/A') {
      return []
    }

    // Separar por comas, pipes, espacios, saltos de línea
    const ids = osmIdString
      .split(/[,|\s\n]+/)
      .map(id => id.trim())
      .filter(id => id && id !== '#N/A' && id !== '')

    return ids
  }

  const parseOsmId = (osmIdString: string): { type: string; id: string } | null => {
    if (!osmIdString || osmIdString.trim() === '' || osmIdString === '#N/A') {
      return null
    }

    // Formato: "R123456" o "relation/123456" o solo "123456"
    const match = osmIdString.match(/([RWN])?(\d+)/)
    if (!match) return null

    let type = match[1] || 'R' // Default to Relation if not specified
    const id = match[2]

    // Convertir letra a tipo completo
    const typeMap: { [key: string]: string } = {
      'R': 'relation',
      'W': 'way',
      'N': 'node'
    }

    return {
      type: typeMap[type] || 'relation',
      id
    }
  }

  const fetchNominatimGeometry = async (osmIdString: string): Promise<NominatimData | null> => {
    const parsed = parseOsmId(osmIdString)
    if (!parsed) return null

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/lookup?osm_ids=${parsed.type[0].toUpperCase()}${parsed.id}&format=geojson&polygon_geojson=1`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch geometry')
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        return {
          osmId: osmIdString,
          geometry: data.features[0].geometry,
          properties: data.features[0].properties
        }
      }

      return null
    } catch (err) {
      console.error('Error fetching geometry:', err)
      return null
    }
  }

  const loadGeometries = async () => {
    if (!row) return

    setLoading(true)
    setError(null)

    try {
      // Parsear múltiples IDs originales
      const originalOsmIds = parseMultipleOsmIds(row.col10)
      const originalPromises = originalOsmIds.map(id => fetchNominatimGeometry(id))

      // Parsear múltiples IDs nuevos
      const newOsmIds = parseMultipleOsmIds(row['NUEVO MAPEO OSM'])
      const newPromises = newOsmIds.map(id => fetchNominatimGeometry(id))

      const [originalResults, newResults] = await Promise.all([
        Promise.all(originalPromises),
        Promise.all(newPromises)
      ])

      // Filtrar nulls
      const originalData = originalResults.filter((d): d is NominatimData => d !== null)
      const newData = newResults.filter((d): d is NominatimData => d !== null)

      setOriginalDataList(originalData)
      setNewDataList(newData)

      if (originalData.length === 0 && newData.length === 0) {
        setError('No se pudieron cargar las geometrías de ninguno de los OSM IDs')
      }
    } catch (err) {
      setError('Error al cargar las geometrías')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(note)
    handleClose()
  }

  const handleClose = () => {
    setOriginalDataList([])
    setNewDataList([])
    setError(null)
    setNote('')
    onClose()
  }

  if (!isOpen || !row) return null

  // Calcular el centro y zoom basado en las geometrías
  const getMapCenter = (dataList: NominatimData[]): [number, number] => {
    if (!dataList || dataList.length === 0) return [19.4326, -99.1332] // Centro de México por defecto

    const firstData = dataList[0]
    const coords = firstData.geometry.coordinates

    if (firstData.geometry.type === 'Point') {
      return [coords[1], coords[0]]
    } else if (firstData.geometry.type === 'Polygon') {
      const firstRing = coords[0]
      const lat = firstRing.reduce((sum: number, c: number[]) => sum + c[1], 0) / firstRing.length
      const lng = firstRing.reduce((sum: number, c: number[]) => sum + c[0], 0) / firstRing.length
      return [lat, lng]
    } else if (firstData.geometry.type === 'MultiPolygon') {
      const firstPolygon = coords[0][0]
      const lat = firstPolygon.reduce((sum: number, c: number[]) => sum + c[1], 0) / firstPolygon.length
      const lng = firstPolygon.reduce((sum: number, c: number[]) => sum + c[0], 0) / firstPolygon.length
      return [lat, lng]
    }

    return [19.4326, -99.1332]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Comparación de Mapeos</h2>
              <div className="mt-2 text-sm text-gray-600">
                <p><span className="font-semibold">ID:</span> {row.col0}</p>
                <p><span className="font-semibold">Nombre:</span> {row.col1}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Loading / Error States */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#ed6103]"></div>
              <span className="ml-3 text-gray-600">Cargando geometrías...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Maps Comparison */}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Original OSM Map */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <h3 className="font-semibold text-gray-800">OSM Original</h3>
                  <p className="text-sm text-gray-600">
                    {row.col10 || 'N/A'}
                    {originalDataList.length > 1 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {originalDataList.length} zonas
                      </span>
                    )}
                  </p>
                </div>
                <div className="h-96">
                  {originalDataList.length > 0 ? (
                    <MapContainer
                      center={getMapCenter(originalDataList)}
                      zoom={10}
                      style={{ height: '100%', width: '100%' }}
                      key={`original-${row.col10}`}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {originalDataList.map((data, index) => (
                        <GeoJSON
                          key={`original-${data.osmId}-${index}`}
                          data={data.geometry}
                          style={{
                            color: COLORS[index % COLORS.length],
                            weight: 2,
                            fillOpacity: 0.2
                          }}
                        />
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <p className="text-gray-500">No hay geometría disponible</p>
                    </div>
                  )}
                </div>
                {/* Legend for original */}
                {originalDataList.length > 1 && (
                  <div className="p-2 bg-gray-50 border-t">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Leyenda:</p>
                    <div className="flex flex-wrap gap-2">
                      {originalDataList.map((data, index) => (
                        <div key={`legend-orig-${index}`} className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs text-gray-600">{data.osmId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* New OSM Map */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <h3 className="font-semibold text-gray-800">Nuevo Mapeo OSM</h3>
                  <p className="text-sm text-gray-600">
                    {row['NUEVO MAPEO OSM'] || 'N/A'}
                    {newDataList.length > 1 && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {newDataList.length} zonas
                      </span>
                    )}
                  </p>
                </div>
                <div className="h-96">
                  {newDataList.length > 0 ? (
                    <MapContainer
                      center={getMapCenter(newDataList)}
                      zoom={10}
                      style={{ height: '100%', width: '100%' }}
                      key={`new-${row['NUEVO MAPEO OSM']}`}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {newDataList.map((data, index) => (
                        <GeoJSON
                          key={`new-${data.osmId}-${index}`}
                          data={data.geometry}
                          style={{
                            color: COLORS[index % COLORS.length],
                            weight: 2,
                            fillOpacity: 0.2
                          }}
                        />
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <p className="text-gray-500">No hay geometría disponible</p>
                    </div>
                  )}
                </div>
                {/* Legend for new */}
                {newDataList.length > 1 && (
                  <div className="p-2 bg-gray-50 border-t">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Leyenda:</p>
                    <div className="flex flex-wrap gap-2">
                      {newDataList.map((data, index) => (
                        <div key={`legend-new-${index}`} className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs text-gray-600">{data.osmId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {!loading && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de confirmación: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe una nota sobre este cambio de mapeo... (obligatorio)"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed6103] focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  * Campo obligatorio para confirmar el cambio
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end border-t pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!note.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#ed6103] hover:bg-[#d55502] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ed6103]"
                  title={!note.trim() ? 'Debes escribir una nota para confirmar el cambio' : 'Confirmar cambio'}
                >
                  Confirmar Cambio
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
