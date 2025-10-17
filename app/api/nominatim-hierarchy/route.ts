import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const country = searchParams.get('country') || 'id'

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon parameters are required' }, { status: 400 })
  }

  try {
    // First, get reverse geocoding to get the main place
    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=16&format=json&addressdetails=1&extratags=1`
    console.log('[NOMINATIM HIERARCHY] Reverse geocoding URL:', reverseUrl)
    const reverseResponse = await fetch(reverseUrl)
    console.log('[NOMINATIM HIERARCHY] Reverse response status:', reverseResponse.status)

    if (!reverseResponse.ok) {
      throw new Error(`Nominatim reverse API returned ${reverseResponse.status}`)
    }

    const reverseData = await reverseResponse.json()
    console.log('[NOMINATIM HIERARCHY] Reverse address keys:', Object.keys(reverseData.address || {}))

    // Now get the hierarchy using the details endpoint
    if (reverseData.osm_type && reverseData.osm_id) {
      const osmTypeMap: Record<string, string> = {
        'node': 'N',
        'way': 'W',
        'relation': 'R'
      }
      const osmPrefix = osmTypeMap[reverseData.osm_type] || 'N'

      const detailsUrl = `https://nominatim.openstreetmap.org/details?osmtype=${osmPrefix}&osmid=${reverseData.osm_id}&addressdetails=1&hierarchy=1&group_hierarchy=1&format=json`
      console.log('[NOMINATIM HIERARCHY] Details URL:', detailsUrl)

      const detailsResponse = await fetch(detailsUrl)
      console.log('[NOMINATIM HIERARCHY] Details response status:', detailsResponse.status)

      if (!detailsResponse.ok) {
        console.error(`Details API returned ${detailsResponse.status}`)
        // Continue without hierarchy data
        return NextResponse.json({
          main: reverseData,
          hierarchy: [],
          address: reverseData.address || {}
        })
      }

      const detailsData = await detailsResponse.json()
      console.log('[NOMINATIM HIERARCHY] Details data keys:', Object.keys(detailsData))
      console.log('[NOMINATIM HIERARCHY] Address items count:', detailsData.address?.length || 0)
      console.log('[NOMINATIM HIERARCHY] Hierarchy keys:', detailsData.hierarchy ? Object.keys(detailsData.hierarchy) : 'none')

      // Extract hierarchy from details
      const hierarchy: Array<{
        osm_type: string
        osm_id: number
        type: string
        localname: string
        admin_level?: number
        rank_address?: number
      }> = []

      // Process hierarchy if available
      if (detailsData.hierarchy) {
        Object.values(detailsData.hierarchy).forEach((items: any) => {
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              hierarchy.push({
                osm_type: item.type,
                osm_id: item.osm_id,
                type: item.localtype || item.type,
                localname: item.localname || item.name || '',
                admin_level: item.admin_level ? parseInt(item.admin_level) : undefined,
                rank_address: item.rank_address ? parseInt(item.rank_address) : undefined
              })
            })
          }
        })
      }

      // Extract address details with metadata
      // Create a map by localname to match with reverseData.address keys
      const addressDetailsByName: Record<string, any> = {}
      const addressDetails: Record<string, any> = {}
      const allAddressItems: any[] = []

      if (detailsData.address) {
        console.log('[NOMINATIM HIERARCHY] Processing address items, sample:', JSON.stringify(detailsData.address[0], null, 2))
        detailsData.address.forEach((addrItem: any) => {
          if (addrItem.localname) {
            // Use osm_type directly from the address item (it's already 'N', 'W', or 'R')
            const osmType = addrItem.osm_type || 'N' // default to node if not present

            console.log(`[NOMINATIM HIERARCHY] Address item: ${addrItem.type} (${addrItem.localname}), rank_address: ${addrItem.rank_address}, admin_level: ${addrItem.admin_level}, isaddress: ${addrItem.isaddress}, distance: ${addrItem.distance}, osm_type: ${osmType}`)

            const itemData = {
              value: addrItem.localname,
              admin_level: addrItem.admin_level,
              rank_address: addrItem.rank_address,
              osm_type: osmType,
              osm_id: addrItem.osm_id,
              class: addrItem.class,
              isaddress: addrItem.isaddress,
              distance: addrItem.distance,
              type: addrItem.type
            }

            // Store by type AND by name for better matching
            addressDetails[addrItem.type] = itemData
            addressDetailsByName[addrItem.localname] = itemData

            // Store all items for the separate list
            allAddressItems.push(itemData)
          }
        })
      }

      // Sort all address items by rank_address (descending) then by distance (ascending)
      allAddressItems.sort((a, b) => {
        // First compare by rank_address (higher rank first)
        const rankA = a.rank_address !== undefined ? parseInt(a.rank_address) : 0
        const rankB = b.rank_address !== undefined ? parseInt(b.rank_address) : 0

        if (rankA !== rankB) {
          return rankB - rankA // Descending order for rank_address
        }

        // If rank_address is the same, sort by distance (closer first)
        const distA = a.distance !== undefined ? parseFloat(a.distance) : Infinity
        const distB = b.distance !== undefined ? parseFloat(b.distance) : Infinity
        return distA - distB
      })

      // Now map the reverseData.address keys to our addressDetails
      // Match by value (localname) since keys might be different
      const finalAddressDetails: Record<string, any> = {}
      if (reverseData.address) {
        Object.entries(reverseData.address).forEach(([key, value]: [string, any]) => {
          const valueStr = typeof value === 'string' ? value : String(value)
          // Try to find by name match
          const details = addressDetailsByName[valueStr] || addressDetails[key]
          if (details) {
            console.log(`[NOMINATIM HIERARCHY] Mapping reverse key '${key}' (${valueStr}) to details with rank_address: ${details.rank_address}`)
            finalAddressDetails[key] = details
          }
        })
      }

      console.log('[NOMINATIM HIERARCHY] Returning hierarchy items:', hierarchy.length)
      console.log('[NOMINATIM HIERARCHY] Returning finalAddressDetails keys:', Object.keys(finalAddressDetails).length)
      console.log('[NOMINATIM HIERARCHY] Returning allAddressItems count:', allAddressItems.length)

      return NextResponse.json({
        main: reverseData,
        hierarchy: hierarchy,
        address: reverseData.address || {},
        addressDetails: finalAddressDetails,
        allAddressItems: allAddressItems
      })
    }

    return NextResponse.json({
      main: reverseData,
      hierarchy: [],
      address: reverseData.address || {}
    })

  } catch (error) {
    console.error('Error fetching from Nominatim hierarchy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Nominatim hierarchy API' },
      { status: 500 }
    )
  }
}
