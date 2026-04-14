import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
})

/** Mandya — default map view */
const DEFAULT_CENTER = [12.5211, 76.8951]
const DEFAULT_ZOOM = 12
const PIN_ZOOM = 16

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

let lastNominatimCall = 0
async function nominatimThrottle() {
  const now = Date.now()
  const wait = 1100 - (now - lastNominatimCall)
  if (wait > 0) await sleep(wait)
  lastNominatimCall = Date.now()
}

async function searchPlaces(query, lang) {
  await nominatimThrottle()
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '8')
  url.searchParams.set('addressdetails', '1')
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': lang === 'kn' ? 'kn,en' : 'en',
      'X-Requested-With': 'MPWaterOrderForm',
    },
  })
  if (!res.ok) throw new Error('search failed')
  return res.json()
}

async function reverseLabel(lat, lon, lang) {
  await nominatimThrottle()
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'json')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': lang === 'kn' ? 'kn,en' : 'en',
      'X-Requested-With': 'MPWaterOrderForm',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.display_name || null
}

export default function LocationMapPicker({ lang, t, mapPin, onMapPinChange, areaInputRef }) {
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showNoHits, setShowNoHits] = useState(false)

  useEffect(() => {
    setShowNoHits(false)
  }, [query])

  useEffect(() => {
    const el = mapElRef.current
    if (!el) return undefined

    const map = L.map(el, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    map.whenReady(() => setMapReady(true))
    mapRef.current = map

    return () => {
      mapRef.current = null
      markerRef.current = null
      map.remove()
      setMapReady(false)
    }
  }, [])

  const ensureMarker = useCallback(
    (lat, lng, onDragEnd) => {
      const map = mapRef.current
      if (!map) return
      if (!markerRef.current) {
        const m = L.marker([lat, lng], { draggable: true }).addTo(map)
        m.on('dragend', onDragEnd)
        markerRef.current = m
      } else {
        markerRef.current.setLatLng([lat, lng])
      }
    },
    [],
  )

  const removeMarker = useCallback(() => {
    const map = mapRef.current
    if (map && markerRef.current) {
      map.removeLayer(markerRef.current)
      markerRef.current = null
    }
  }, [])

  const onMarkerDragged = useCallback(async () => {
    const m = markerRef.current
    if (!m) return
    const { lat, lng } = m.getLatLng()
    const label = await reverseLabel(lat, lng, lang)
    onMapPinChange({ lat, lng, label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
  }, [lang, onMapPinChange])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    if (!mapPin) {
      removeMarker()
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      return
    }

    ensureMarker(mapPin.lat, mapPin.lng, onMarkerDragged)
    map.setView([mapPin.lat, mapPin.lng], PIN_ZOOM)
  }, [mapPin, mapReady, ensureMarker, removeMarker, onMarkerDragged])

  const runSearch = async () => {
    const q = query.trim()
    if (!q) return
    setError(null)
    setShowNoHits(false)
    setLoading(true)
    setResults([])
    try {
      const data = await searchPlaces(q, lang)
      const list = Array.isArray(data) ? data : []
      setResults(list)
      setShowNoHits(list.length === 0)
    } catch {
      setError(t('map_error'))
      setShowNoHits(false)
    } finally {
      setLoading(false)
    }
  }

  const pickResult = async (item) => {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) return
    const label = item.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    onMapPinChange({ lat, lng: lon, label })
    setResults([])
    setShowNoHits(false)
  }

  const applyToAreaField = () => {
    if (!mapPin?.label || !areaInputRef?.current) return
    areaInputRef.current.value = mapPin.label
    areaInputRef.current.focus()
  }

  const openInGoogleMaps = () => {
    if (!mapPin) return
    const url = `https://www.google.com/maps?q=${mapPin.lat},${mapPin.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="map-picker">
      <p className="map-picker__title">{t('map_pick_title')}</p>
      <p className="map-picker__hint">{t('map_pick_hint')}</p>

      <div className="map-picker__search">
        <input
          type="search"
          className="map-picker__search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
          placeholder={t('map_search_placeholder')}
          aria-label={t('map_search_placeholder')}
        />
        <button type="button" className="btn btn--outline map-picker__search-btn" onClick={runSearch} disabled={loading}>
          {loading ? t('map_search_loading') : t('map_search_btn')}
        </button>
      </div>

      {error && <p className="map-picker__error">{error}</p>}

      {results.length > 0 && (
        <ul className="map-picker__results" role="listbox" aria-label={t('map_results_label')}>
          {results.map((item) => (
            <li key={`${item.place_id}-${item.lat}-${item.lon}`}>
              <button type="button" className="map-picker__result-btn" onClick={() => pickResult(item)}>
                {item.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showNoHits && !loading && !error && <p className="map-picker__empty">{t('map_no_results')}</p>}

      <div ref={mapElRef} className="map-picker__map" role="application" aria-label={t('map_pick_title')} />

      {mapPin && (
        <div className="map-picker__footer">
          <p className="map-picker__selected">
            <strong>{t('map_selected_prefix')}</strong> {mapPin.label}
          </p>
          <div className="map-picker__actions">
            <button type="button" className="btn btn--outline" onClick={applyToAreaField}>
              {t('map_apply_area')}
            </button>
            <button type="button" className="btn btn--outline map-picker__gmaps" onClick={openInGoogleMaps}>
              {t('map_open_maps')}
            </button>
          </div>
          <p className="map-picker__drag-hint">{t('map_drag_hint')}</p>
        </div>
      )}
    </div>
  )
}
