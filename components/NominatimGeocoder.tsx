'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { COUNTRIES } from '@/utils/countries'

// Import LeafletMapComponent dynamically to avoid SSR issues
const LeafletMapComponent = dynamic(
  () => import('./NominatimMapComponent'),
  { ssr: false }
)

interface SearchResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  osm_type: string
  osm_id: number
  class: string
  type: string
}

interface ReverseResult {
  place_id: number
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  address?: Record<string, string>
}

interface AddressGeo {
  key: string
  value: string
  selected: boolean
  admin_level?: string
  rank_address?: string
  osm_type?: string
  osm_id?: number
  class?: string
  isaddress?: boolean
  distance?: number
  type?: string
}

export function NominatimGeocoder() {
  const [searchText, setSearchText] = useState('Sokaraja, Banyumas')
  const [selectedCountry, setSelectedCountry] = useState('id')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const [reverseResult, setReverseResult] = useState<ReverseResult | null>(null)
  const [addressGeos, setAddressGeos] = useState<AddressGeo[]>([])
  const [allAddressGeos, setAllAddressGeos] = useState<AddressGeo[]>([]) // Store all items without filtering
  const [builtAddress, setBuiltAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingReverse, setLoadingReverse] = useState(false)
  const [showNonAddress, setShowNonAddress] = useState(false)
  const [disableAllFilters, setDisableAllFilters] = useState(false)

  const handleSearch = async () => {
    if (!searchText.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/nominatim-search?q=${encodeURIComponent(searchText)}&country=${selectedCountry}`
      )
      const data = await response.json()
      setSearchResults(data)

      // If we have results, set marker to first result
      if (data.length > 0) {
        const firstResult = data[0]
        const lat = parseFloat(firstResult.lat)
        const lon = parseFloat(firstResult.lon)
        setMarkerPosition([lat, lon])
        // Trigger reverse geocoding
        handleReverseGeocode(lat, lon)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReverseGeocode = async (lat: number, lon: number) => {
    setLoadingReverse(true)
    try {
      // Use the new hierarchy API
      const response = await fetch(
        `/api/nominatim-hierarchy?lat=${lat}&lon=${lon}&country=${selectedCountry}`
      )
      const data = await response.json()

      if (data.main) {
        setReverseResult(data.main)
      }

      // Use allAddressItems from API (already sorted by distance)
      if (data.allAddressItems && Array.isArray(data.allAddressItems)) {
        // Map all items without filtering
        const allItems = data.allAddressItems
          .map((item: any) => {
            const geoItem = {
              key: item.type,
              value: item.value,
              selected: item.isaddress === true, // Auto-select items with isaddress: true
              admin_level: item.admin_level?.toString(),
              rank_address: item.rank_address?.toString(),
              osm_type: item.osm_type,
              osm_id: item.osm_id,
              class: item.class,
              isaddress: item.isaddress,
              distance: item.distance,
              type: item.type
            }
            console.log(`[COMPONENT] Mapped address item: ${item.type} (${item.value}), rank_address: ${geoItem.rank_address}, isaddress: ${geoItem.isaddress}, distance: ${geoItem.distance}, selected: ${geoItem.selected}`)
            return geoItem
          })

        // Store all items
        setAllAddressGeos(allItems)

        // Apply filters
        const filteredItems = allItems.filter((geo: AddressGeo) => {
          // Exclude specific types: country, postcode, country_code
          const excludedTypes = ['country', 'postcode', 'country_code']
          if (excludedTypes.includes(geo.key)) {
            console.log(`[COMPONENT] Excluding ${geo.key} (${geo.value}) - excluded type`)
            return false
          }

          // Filter items with rank_address between 8 and 18 (inclusive)
          if (!geo.rank_address) {
            console.log(`[COMPONENT] Excluding ${geo.key} (${geo.value}) - no rank_address`)
            return false // Exclude items without rank_address
          }
          const rankAddress = parseInt(geo.rank_address)
          const include = rankAddress >= 8 && rankAddress <= 18
          console.log(`[COMPONENT] ${include ? 'Including' : 'Excluding'} ${geo.key} (${geo.value}) - rank_address: ${rankAddress}`)
          return include
        })

        console.log('[COMPONENT] Address geos count (after filter):', filteredItems.length)
        setAddressGeos(filteredItems)
        // Build address with auto-selected items
        buildAddress(filteredItems)
      }

    } catch (error) {
      console.error('Error reverse geocoding:', error)
    } finally {
      setLoadingReverse(false)
    }
  }

  const handleMarkerMove = (lat: number, lon: number) => {
    setMarkerPosition([lat, lon])
    handleReverseGeocode(lat, lon)
  }

  const toggleGeoSelection = (index: number) => {
    const newAddressGeos = [...addressGeos]
    newAddressGeos[index].selected = !newAddressGeos[index].selected
    setAddressGeos(newAddressGeos)
    buildAddress(newAddressGeos)
  }

  const buildAddress = (geos: AddressGeo[]) => {
    const selectedValues = geos
      .filter(geo => geo.selected)
      .sort((a, b) => {
        // Sort by rank_address descending (higher rank first)
        const rankA = a.rank_address ? parseInt(a.rank_address) : 0
        const rankB = b.rank_address ? parseInt(b.rank_address) : 0
        return rankB - rankA
      })
      .map(geo => geo.value)
      .join(', ')
    setBuiltAddress(selectedValues)
  }

  // Re-apply filters when disableAllFilters changes
  useEffect(() => {
    if (allAddressGeos.length === 0) return

    if (disableAllFilters) {
      // Show all items without filtering
      // Create a Set of currently selected items (by key+value to identify them uniquely)
      const currentSelectedKeys = new Set(
        addressGeos
          .filter(geo => geo.selected)
          .map(geo => `${geo.key}-${geo.value}`)
      )

      // Map all items, preserving selection only for items that were already visible
      const allItemsWithSelection = allAddressGeos.map(geo => ({
        ...geo,
        selected: currentSelectedKeys.has(`${geo.key}-${geo.value}`)
      }))

      setAddressGeos(allItemsWithSelection)
      buildAddress(allItemsWithSelection)
    } else {
      // Apply filters, preserve selected state for items that pass the filter
      const filteredItems = allAddressGeos.filter((geo: AddressGeo) => {
        // Exclude specific types: country, postcode, country_code
        const excludedTypes = ['country', 'postcode', 'country_code']
        if (excludedTypes.includes(geo.key)) {
          return false
        }

        // Filter items with rank_address between 8 and 18 (inclusive)
        if (!geo.rank_address) {
          return false
        }
        const rankAddress = parseInt(geo.rank_address)
        return rankAddress >= 8 && rankAddress <= 18
      })
      setAddressGeos(filteredItems)
      buildAddress(filteredItems)
    }
  }, [disableAllFilters, allAddressGeos])

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Búsqueda de Geocodificación</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              País:
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed6103]"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-[2]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Texto de búsqueda:
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ej: Sokaraja, Banyumas"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed6103]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !searchText.trim()}
              className="bg-[#ed6103] hover:bg-[#d55502] text-white px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              Resultados ({searchResults.length}):
            </h3>
            <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-lg">
              {searchResults.map((result) => (
                <div
                  key={result.place_id}
                  className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-xs"
                  onClick={() => {
                    const lat = parseFloat(result.lat)
                    const lon = parseFloat(result.lon)
                    setMarkerPosition([lat, lon])
                    handleReverseGeocode(lat, lon)
                  }}
                >
                  {result.display_name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Map on Left, Info on Right */}
      {markerPosition && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Map */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Mapa Interactivo</h2>
            <p className="text-xs text-gray-600 mb-3">
              Arrastra la chincheta para actualizar la ubicación
            </p>
            <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
              <LeafletMapComponent
                initialPosition={markerPosition}
                onMarkerMove={handleMarkerMove}
              />
            </div>
            {loadingReverse && (
              <div className="mt-2 text-center text-xs text-gray-500">
                Geocodificando posición...
              </div>
            )}
          </div>

          {/* Right Column: Geocoding Info and Address Builder */}
          <div className="space-y-4">
            {/* Reverse Geocoding Result */}
            {reverseResult && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                  Información de la Ubicación
                </h2>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">Ubicación:</span>
                    <p className="text-gray-600 mt-1">{reverseResult.display_name}</p>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">Coordenadas:</span>
                    <p>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${reverseResult.lat}&mlon=${reverseResult.lon}&zoom=16`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                      >
                        {reverseResult.lat}, {reverseResult.lon}
                      </a>
                    </p>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">OSM:</span>
                    <p>
                      <a
                        href={`https://www.openstreetmap.org/${reverseResult.osm_type}/${reverseResult.osm_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                      >
                        {reverseResult.osm_type} #{reverseResult.osm_id}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Address Components */}
            {addressGeos.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    Componentes de Dirección
                  </h2>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disableAllFilters}
                        onChange={(e) => setDisableAllFilters(e.target.checked)}
                        className="w-4 h-4 text-[#ed6103] focus:ring-[#ed6103] rounded cursor-pointer"
                      />
                      <span className="text-gray-700">Sin filtros</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNonAddress}
                        onChange={(e) => setShowNonAddress(e.target.checked)}
                        className="w-4 h-4 text-[#ed6103] focus:ring-[#ed6103] rounded cursor-pointer"
                      />
                      <span className="text-gray-700">Mostrar no-address</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Selecciona los componentes para construir la dirección:
                </p>

                {/* Table layout */}
                <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-2 text-left w-8"></th>
                        <th className="px-2 py-2 text-left">Tipo</th>
                        <th className="px-2 py-2 text-left">Valor</th>
                        <th className="px-2 py-2 text-center w-16">Admin</th>
                        <th className="px-2 py-2 text-center w-16">Rank</th>
                        <th className="px-2 py-2 text-center w-20">Distancia</th>
                        <th className="px-2 py-2 text-center w-16">Addr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addressGeos
                        .map((geo, originalIndex) => ({ geo, originalIndex }))
                        .filter(({ geo }) => showNonAddress || geo.isaddress !== false)
                        .map(({ geo, originalIndex }) => (
                        <tr
                          key={`${geo.osm_type}-${geo.osm_id}-${geo.key}-${originalIndex}`}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={geo.selected}
                              onChange={() => toggleGeoSelection(originalIndex)}
                              className="w-4 h-4 text-[#ed6103] focus:ring-[#ed6103] rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-2 py-2 font-medium text-gray-700">{geo.key}</td>
                          <td className="px-2 py-2">
                            {geo.osm_type && geo.osm_id ? (
                              <a
                                href={`https://www.openstreetmap.org/${geo.osm_type}/${geo.osm_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {geo.value}
                              </a>
                            ) : (
                              <span className="text-gray-600">{geo.value}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {geo.admin_level && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded whitespace-nowrap">
                                {geo.admin_level}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {geo.rank_address && (
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded whitespace-nowrap">
                                {geo.rank_address}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {geo.distance !== undefined && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded whitespace-nowrap">
                                {parseFloat(geo.distance.toString()).toFixed(4)}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {geo.isaddress === false && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded whitespace-nowrap">
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Built Address */}
                {builtAddress && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h3 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Dirección construida:
                    </h3>
                    <p className="text-sm text-green-700 font-medium">{builtAddress}</p>
                  </div>
                )}

                {addressGeos.some(g => g.selected) && !builtAddress && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-700">
                      Selecciona al menos un componente para construir la dirección
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
