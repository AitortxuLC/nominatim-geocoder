'use client'

import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import { ComparisonMapModal } from './ComparisonMapModal'

interface GeoRow {
  col0: string // id
  col1: string // nombre
  col2: string // nombre del padre
  col3: string // slug
  col4: string // id del padre
  col5: string // nivel
  col6: string // geos cercanos
  col7: string // coordenadas
  col8: string // (vacío generalmente)
  col9: string // id de lamudi classic
  col10: string // id de osm
  'mapeo osm estados': string
  'mapeo osm municipios': string
  'mapeo osm colonia': string
  'NUEVO MAPEO OSM': string
  'Es el mismo mapeo?': string
  _index?: number // internal index for tracking
  _confirmationNote?: string // user confirmation note
  [key: string]: string | number | undefined
}

export function GeosMapper() {
  const [data, setData] = useState<GeoRow[]>([])
  const [filteredData, setFilteredData] = useState<GeoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterOsmNotInMapping, setFilterOsmNotInMapping] = useState(true)
  const [filterWithoutOsmId, setFilterWithoutOsmId] = useState(true)
  const [filterWithoutNuevoMapeo, setFilterWithoutNuevoMapeo] = useState(true)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedRowForConfirm, setSelectedRowForConfirm] = useState<GeoRow | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const headers = [
    { key: 'col0', label: 'ID' },
    { key: 'col1', label: 'Nombre' },
    { key: 'col2', label: 'Nombre Padre' },
    { key: 'col3', label: 'Slug' },
    { key: 'col4', label: 'ID Padre' },
    { key: 'col5', label: 'Nivel' },
    { key: 'col7', label: 'Coordenadas' },
    { key: 'col9', label: 'ID Lamudi' },
    { key: 'col10', label: 'ID OSM' },
    { key: 'mapeo osm estados', label: 'OSM Estado' },
    { key: 'mapeo osm municipios', label: 'OSM Municipio' },
    { key: 'mapeo osm colonia', label: 'OSM Colonia' },
    { key: 'NUEVO MAPEO OSM', label: 'Nuevo Mapeo OSM' }
  ]

  const osmColumns = ['col10', 'mapeo osm estados', 'mapeo osm municipios', 'mapeo osm colonia', 'NUEVO MAPEO OSM']

  // Load default CSV file on mount
  useEffect(() => {
    const loadDefaultFile = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/data/ID - Mapping Geos Lamudi - csv locations lamudi sample.csv')

        if (!response.ok) {
          throw new Error('Failed to load default CSV file')
        }

        const csvText = await response.text()

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data as GeoRow[]
            // Add internal index for tracking
            const dataWithIndex = parsedData.map((row, index) => ({ ...row, _index: index }))
            setData(dataWithIndex)
            applyFilters(dataWithIndex, searchText, filterOsmNotInMapping, filterWithoutOsmId, filterWithoutNuevoMapeo)
            setLoading(false)
          },
          error: (error: Error) => {
            setError(`Error parsing default CSV: ${error.message}`)
            setLoading(false)
          }
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error loading default file')
        setLoading(false)
      }
    }

    loadDefaultFile()
  }, []) // Empty dependency array means this runs once on mount

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as GeoRow[]
        // Add internal index for tracking
        const dataWithIndex = parsedData.map((row, index) => ({ ...row, _index: index }))
        setData(dataWithIndex)
        applyFilters(dataWithIndex, searchText, filterOsmNotInMapping, filterWithoutOsmId, filterWithoutNuevoMapeo)
        setLoading(false)
      },
      error: (error: Error) => {
        setError(`Error parsing CSV: ${error.message}`)
        setLoading(false)
      }
    })
  }

  const applyFilters = (sourceData: GeoRow[], search: string, osmFilter: boolean, withoutOsmFilter: boolean, withoutNuevoMapeoFilter: boolean) => {
    let filtered = [...sourceData]

    // Filter rows without OSM ID
    if (withoutOsmFilter) {
      filtered = filtered.filter(row => {
        const osmId = row.col10?.trim()
        return osmId && osmId !== '' && osmId !== '#N/A'
      })
    }

    // Filter rows without Nuevo Mapeo OSM
    if (withoutNuevoMapeoFilter) {
      filtered = filtered.filter(row => {
        const nuevoMapeo = row['NUEVO MAPEO OSM']?.trim()
        return nuevoMapeo && nuevoMapeo !== '' && nuevoMapeo !== '#N/A'
      })
    }

    // Text search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(row => {
        return Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      })
    }

    // OSM ID not in Nuevo Mapeo filter
    if (osmFilter) {
      filtered = filtered.filter(row => {
        const osmId = row.col10?.trim()
        if (!osmId) return true // Keep rows without OSM ID

        const nuevoMapeo = row['NUEVO MAPEO OSM'] || ''
        const mapeoIds = nuevoMapeo.split(',').map(id => id.trim())

        return !mapeoIds.includes(osmId)
      })
    }

    setFilteredData(filtered)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    applyFilters(data, value, filterOsmNotInMapping, filterWithoutOsmId, filterWithoutNuevoMapeo)
  }

  const handleOsmFilterChange = (checked: boolean) => {
    setFilterOsmNotInMapping(checked)
    applyFilters(data, searchText, checked, filterWithoutOsmId, filterWithoutNuevoMapeo)
  }

  const handleWithoutOsmFilterChange = (checked: boolean) => {
    setFilterWithoutOsmId(checked)
    applyFilters(data, searchText, filterOsmNotInMapping, checked, filterWithoutNuevoMapeo)
  }

  const handleWithoutNuevoMapeoFilterChange = (checked: boolean) => {
    setFilterWithoutNuevoMapeo(checked)
    applyFilters(data, searchText, filterOsmNotInMapping, filterWithoutOsmId, checked)
  }

  const handleCellEdit = (rowIndex: number, columnKey: string, value: string) => {
    const updatedData = [...data]
    const actualIndex = filteredData[rowIndex]._index!
    updatedData[actualIndex] = {
      ...updatedData[actualIndex],
      [columnKey]: value
    }
    setData(updatedData)
    applyFilters(updatedData, searchText, filterOsmNotInMapping, filterWithoutOsmId, filterWithoutNuevoMapeo)
  }

  const handleOpenConfirmModal = (row: GeoRow) => {
    setSelectedRowForConfirm(row)
    setConfirmModalOpen(true)
  }

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false)
    setSelectedRowForConfirm(null)
  }

  const handleSaveConfirmation = (note: string) => {
    if (selectedRowForConfirm) {
      const updatedData = [...data]
      const actualIndex = selectedRowForConfirm._index!
      updatedData[actualIndex] = {
        ...updatedData[actualIndex],
        _confirmationNote: note
      }
      setData(updatedData)
      applyFilters(updatedData, searchText, filterOsmNotInMapping, filterWithoutOsmId, filterWithoutNuevoMapeo)
    }
  }

  const createOsmLink = (osmId: string) => {
    if (!osmId || osmId === '#N/A' || !osmId.trim()) return null

    // Handle multiple IDs separated by comma
    const ids = osmId.split(',').map(id => id.trim()).filter(id => id && id !== '#N/A')
    if (ids.length === 0) return null

    return ids.map((id, index) => {
      const osmType = id.startsWith('R') ? 'R' : id.startsWith('W') ? 'W' : id.startsWith('N') ? 'N' : 'R'
      const osmIdNum = id.replace(/[RWN]/g, '')

      return (
        <span key={index}>
          {index > 0 && ', '}
          <a
            href={`https://nominatim.openstreetmap.org/ui/details.html?osmtype=${osmType}&osmid=${osmIdNum}&class=boundary`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-semibold"
          >
            {id}
          </a>
        </span>
      )
    })
  }

  const exportData = () => {
    const exportRows = data.map(row => {
      // Si la fila está confirmada, usar el nuevo mapeo OSM
      let osmIdToExport = row.col10

      if (row._confirmationNote) {
        // Fila confirmada: usar NUEVO MAPEO OSM
        const nuevoMapeo = row['NUEVO MAPEO OSM'] || row.col10
        // Convertir comas y espacios a pipes
        osmIdToExport = nuevoMapeo.replace(/[,\s]+/g, '|').trim()
      }

      return {
        id: row.col0,
        nombre: row.col1,
        'nombre del padre': row.col2,
        slug: row.col3,
        'id del padre': row.col4,
        nivel: row.col5,
        'geos cercanos': row.col6,
        coordenadas: row.col7,
        'id de lamudi classic': row.col9,
        'id de osm': `|${row.col9}|${osmIdToExport}`,
        'nota de confirmación': row._confirmationNote || ''
      }
    })

    const csv = Papa.unparse(exportRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `geos_mapped_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Geos Mapper</h1>
              <p className="text-sm text-gray-600">
                Mapeo de geos Lamudi con OSM
                {data.length > 0 && ` (${filteredData.length} de ${data.length} registros)`}
              </p>
            </div>

            {/* File Upload */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ed6103] hover:bg-[#d55502] rounded-lg transition-colors"
              >
                Cargar CSV
              </button>
              {data.length > 0 && (
                <button
                  onClick={exportData}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-green-100 hover:bg-green-200 border border-green-300 rounded-lg transition-colors"
                >
                  Exportar CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#ed6103]"></div>
              <span className="text-sm font-medium text-gray-700">Cargando archivo CSV...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters and Data Table */}
        {!loading && data.length > 0 && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Filtros</h2>

              <div className="space-y-4">
                {/* Text Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar en todas las columnas:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Escribe para filtrar..."
                      className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed6103]"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Filter without OSM ID */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterWithoutOsmId}
                      onChange={(e) => handleWithoutOsmFilterChange(e.target.checked)}
                      className="w-4 h-4 text-[#ed6103] focus:ring-[#ed6103] rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ocultar registros sin ID OSM
                      <span className="ml-2 text-xs text-gray-500">
                        ({data.filter(row => {
                          const osmId = row.col10?.trim()
                          return osmId && osmId !== '' && osmId !== '#N/A'
                        }).length} registros)
                      </span>
                    </span>
                  </label>
                </div>

                {/* Filter without Nuevo Mapeo */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterWithoutNuevoMapeo}
                      onChange={(e) => handleWithoutNuevoMapeoFilterChange(e.target.checked)}
                      className="w-4 h-4 text-[#ed6103] focus:ring-[#ed6103] rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ocultar registros sin Nuevo Mapeo OSM
                      <span className="ml-2 text-xs text-gray-500">
                        ({data.filter(row => {
                          const nuevoMapeo = row['NUEVO MAPEO OSM']?.trim()
                          return nuevoMapeo && nuevoMapeo !== '' && nuevoMapeo !== '#N/A'
                        }).length} registros)
                      </span>
                    </span>
                  </label>
                </div>

                {/* OSM Filter */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOsmNotInMapping}
                      onChange={(e) => handleOsmFilterChange(e.target.checked)}
                      className="w-4 h-4 text-[#ed6103] focus:ring-[#ed6103] rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mostrar solo registros donde ID OSM no esté en Nuevo Mapeo OSM
                      <span className="ml-2 text-xs text-gray-500">
                        ({data.filter(row => {
                          const osmId = row.col10?.trim()
                          if (!osmId) return true
                          const nuevoMapeo = row['NUEVO MAPEO OSM'] || ''
                          const mapeoIds = nuevoMapeo.split(',').map(id => id.trim())
                          return !mapeoIds.includes(osmId)
                        }).length} registros)
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Datos</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      {headers.map((header) => (
                        <th
                          key={header.key}
                          className="px-2 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                        >
                          {header.label}
                        </th>
                      ))}
                      <th className="px-2 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, rowIndex) => (
                      <tr
                        key={row._index}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {headers.map((header) => {
                          const value = row[header.key as keyof GeoRow] as string
                          const isOsmColumn = osmColumns.includes(header.key)

                          return (
                            <td key={header.key} className="px-2 py-2">
                              {isOsmColumn && value ? (
                                <div>{createOsmLink(value)}</div>
                              ) : (
                                <input
                                  type="text"
                                  value={value || ''}
                                  onChange={(e) => handleCellEdit(rowIndex, header.key, e.target.value)}
                                  className="w-full px-1 py-1 text-xs border border-transparent hover:border-gray-300 focus:border-[#ed6103] focus:outline-none rounded"
                                />
                              )}
                            </td>
                          )
                        })}
                        <td className="px-2 py-2">
                          <button
                            onClick={() => handleOpenConfirmModal(row)}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                              row._confirmationNote
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                : 'bg-[#ed6103] text-white hover:bg-[#d55502]'
                            }`}
                            title={row._confirmationNote ? 'Ver confirmación' : 'Examinar mapeo'}
                          >
                            {row._confirmationNote ? '✓ Confirmado' : 'Examinar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay datos que coincidan con los filtros
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay archivo cargado</h3>
            <p className="mt-1 text-sm text-gray-500">Haz clic en "Cargar CSV" para comenzar</p>
          </div>
        )}
      </div>

      {/* Comparison Map Modal */}
      <ComparisonMapModal
        isOpen={confirmModalOpen}
        row={selectedRowForConfirm}
        onClose={handleCloseConfirmModal}
        onConfirm={handleSaveConfirmation}
      />
    </div>
  )
}
