'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface NominatimMapComponentProps {
  initialPosition: [number, number]
  onMarkerMove: (lat: number, lon: number) => void
}

export default function NominatimMapComponent({
  initialPosition,
  onMarkerMove,
}: NominatimMapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    // Only initialize map if it doesn't exist
    if (!mapRef.current) {
      // Create map
      const map = L.map('nominatim-map').setView(initialPosition, 13)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Create custom draggable marker icon
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      // Create draggable marker
      const marker = L.marker(initialPosition, {
        draggable: true,
        icon: customIcon,
      }).addTo(map)

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        onMarkerMove(position.lat, position.lng)
      })

      // Store refs
      mapRef.current = map
      markerRef.current = marker
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, []) // Empty dependency array - only run once

  // Update marker position when initialPosition changes
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng(initialPosition)
      // Pan to the new position without changing zoom
      mapRef.current.panTo(initialPosition)
    }
  }, [initialPosition])

  return <div id="nominatim-map" style={{ width: '100%', height: '100%' }} />
}
