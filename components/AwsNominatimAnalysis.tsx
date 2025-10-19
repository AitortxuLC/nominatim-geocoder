'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'

interface CsvRow {
  [key: string]: string
}

interface SearchMethodStats {
  method: string
  count: number
  percentage: number
}

export function AwsNominatimAnalysis() {
  const [data, setData] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchMethodStats, setSearchMethodStats] = useState<SearchMethodStats[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  useEffect(() => {
    loadCsvData()
  }, [])

  const loadCsvData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/data/aws_data_matched_with_osm.csv')

      if (!response.ok) {
        throw new Error('Failed to load CSV file')
      }

      const csvText = await response.text()

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as CsvRow[]
          setData(parsedData)

          if (parsedData.length > 0) {
            setHeaders(Object.keys(parsedData[0]))
            calculateSearchMethodStats(parsedData)
          }

          setLoading(false)
        },
        error: (error: Error) => {
          setError(`Error parsing CSV: ${error.message}`)
          setLoading(false)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const calculateSearchMethodStats = (rows: CsvRow[]) => {
    const methodCounts: Record<string, number> = {}

    rows.forEach(row => {
      const method = row.search_method || 'unknown'
      methodCounts[method] = (methodCounts[method] || 0) + 1
    })

    const total = rows.length
    const stats: SearchMethodStats[] = Object.entries(methodCounts).map(([method, count]) => ({
      method,
      count,
      percentage: (count / total) * 100
    }))

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count)
    setSearchMethodStats(stats)
  }

  const isUrl = (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const renderCellValue = (value: string) => {
    if (isUrl(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          {value.length > 50 ? value.substring(0, 50) + '...' : value}
        </a>
      )
    }
    return <span className="text-gray-700">{value}</span>
  }

  // Get filtered data based on selected filter
  const filteredData = selectedFilter
    ? data.filter(row => {
        // If filtering by "unknown", include empty/undefined values
        if (selectedFilter === 'unknown') {
          return !row.search_method || row.search_method === 'unknown'
        }
        return row.search_method === selectedFilter
      })
    : data

  const handleFilterClick = (method: string) => {
    setSelectedFilter(selectedFilter === method ? null : method)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#ed6103]"></div>
          <span className="text-sm font-medium text-gray-700">Cargando datos de AWS-Nominatim...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">AWS-Nominatim Analysis</h1>
          <p className="text-sm text-gray-600">
            Análisis de datos de matching entre AWS y Nominatim ({data.length} registros)
          </p>
        </div>

        {/* Search Method Statistics */}
        {searchMethodStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Estadísticas por Método de Búsqueda
              </h2>
              {selectedFilter && (
                <button
                  onClick={() => setSelectedFilter(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Haz clic en una tarjeta para filtrar los registros
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {searchMethodStats.map((stat) => (
                <button
                  key={stat.method}
                  onClick={() => handleFilterClick(stat.method)}
                  className={`text-left rounded-lg p-3 transition-all transform hover:scale-105 ${
                    selectedFilter === stat.method
                      ? 'bg-gradient-to-br from-[#ed6103] to-[#d55502] border-2 border-[#ed6103] shadow-lg'
                      : 'bg-gradient-to-br from-[#ed6103]/10 to-[#ed6103]/5 border border-[#ed6103]/20 hover:border-[#ed6103]/40'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${
                    selectedFilter === stat.method ? 'text-white' : 'text-gray-600'
                  }`}>
                    {stat.method}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <div className={`text-2xl font-bold ${
                      selectedFilter === stat.method ? 'text-white' : 'text-[#ed6103]'
                    }`}>
                      {stat.percentage.toFixed(1)}%
                    </div>
                    <div className={`text-xs ${
                      selectedFilter === stat.method ? 'text-white/90' : 'text-gray-500'
                    }`}>
                      ({stat.count})
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedFilter ? (
                <>
                  Registros filtrados por: <span className="text-[#ed6103]">{selectedFilter}</span>
                </>
              ) : (
                'Todos los Registros'
              )}
            </h2>
            <div className="text-sm text-gray-600">
              Mostrando {filteredData.length} de {data.length} registros
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {headers.map((header) => (
                      <td key={header} className="px-4 py-3 whitespace-nowrap">
                        {renderCellValue(row[header] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {selectedFilter
                ? `No hay registros con el método de búsqueda "${selectedFilter}"`
                : 'No hay datos para mostrar'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
