import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'

type Role = 'none' | 'customer' | 'admin'
type Status = 'booked' | 'in_progress' | 'on_the_way' | 'delivered' | 'cancelled'
type AppTab = 'home' | 'orders' | 'profile' | 'settings' | 'admin'

type CustomerProfile = {
  name: string
  address: string
}

type Order = {
  id: string
  phone: string
  customerName: string
  customerAddress: string
  cans: number
  notes: string
  status: Status
  createdAt: string
  /** When the customer wants delivery (free text, e.g. 12 Apr 2026) */
  deliveryDate: string
  /** Preferred time window (free text, e.g. 5:00–7:00 PM) */
  deliveryTime: string
  /** Drop-off location for this order (may differ from profile address) */
  deliveryLocation: string
  /** Number to call for this delivery */
  contactPhone: string
  /** Parsed delivery moment (ms) for cancellation cutoff; null if legacy / unparseable */
  deliveryAtMs: number | null
}

const CANCEL_CUTOFF_MS = 3 * 60 * 60 * 1000

const STORAGE_ORDERS = 'mp-mobile-orders-v3'
const STORAGE_ORDERS_LEGACY = 'mp-mobile-orders-v2'

function normalizeOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<Order>
  if (
    typeof o.id !== 'string' ||
    typeof o.phone !== 'string' ||
    typeof o.customerName !== 'string' ||
    typeof o.customerAddress !== 'string' ||
    typeof o.cans !== 'number' ||
    typeof o.status !== 'string' ||
    typeof o.createdAt !== 'string'
  ) {
    return null
  }
  return {
    id: o.id,
    phone: o.phone,
    customerName: o.customerName,
    customerAddress: o.customerAddress,
    cans: o.cans,
    notes: typeof o.notes === 'string' ? o.notes : '',
    status: o.status as Status,
    createdAt: o.createdAt,
    deliveryDate: typeof o.deliveryDate === 'string' ? o.deliveryDate : '',
    deliveryTime: typeof o.deliveryTime === 'string' ? o.deliveryTime : '',
    deliveryLocation: typeof o.deliveryLocation === 'string' ? o.deliveryLocation : '',
    contactPhone: typeof o.contactPhone === 'string' ? o.contactPhone : o.phone,
    deliveryAtMs: (() => {
      if (typeof o.deliveryAtMs === 'number' && Number.isFinite(o.deliveryAtMs)) {
        return o.deliveryAtMs
      }
      const dd = typeof o.deliveryDate === 'string' ? o.deliveryDate : ''
      const tt = typeof o.deliveryTime === 'string' ? o.deliveryTime : ''
      if (!dd || !tt) return null
      return parseDeliveryToTimestamp(dd, tt)
    })(),
  }
}

/** Use first part of a range like "5:00 – 7:00 PM" for parsing. */
function firstTimeSegment(timeStr: string): string {
  const t = timeStr.trim()
  const parts = t.split(/\s*[–—-]\s*/)
  return (parts[0] ?? t).trim()
}

/**
 * Best-effort parse for India-style dates + times. Returns null if not parseable.
 */
function parseDeliveryToTimestamp(dateStr: string, timeStr: string): number | null {
  const d = dateStr.trim()
  const t = firstTimeSegment(timeStr)
  if (!d || !t) return null

  const tryMs = (s: string) => {
    const x = Date.parse(s)
    return Number.isNaN(x) ? null : x
  }

  let ms = tryMs(`${d} ${t}`)
  if (ms !== null) return ms

  ms = tryMs(`${d}T${t}`)
  if (ms !== null) return ms

  const md = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (md) {
    const dd = md[1].padStart(2, '0')
    const mm = md[2].padStart(2, '0')
    const yyyy = md[3]
    ms = tryMs(`${yyyy}-${mm}-${dd}T${t}`)
    if (ms !== null) return ms
    ms = tryMs(`${yyyy}-${mm}-${dd} ${t}`)
    if (ms !== null) return ms
  }

  const md2 = d.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (md2) {
    ms = tryMs(`${md2[1]}-${md2[2]}-${md2[3]}T${t}`)
    if (ms !== null) return ms
    ms = tryMs(`${md2[1]}-${md2[2]}-${md2[3]} ${t}`)
    if (ms !== null) return ms
  }

  return null
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function defaultNextDeliveryDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return d
}

function defaultDeliveryTime(): Date {
  const d = new Date()
  d.setHours(9, 0, 0, 0)
  d.setSeconds(0, 0)
  return d
}

function formatOrderDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatOrderTimeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Single instant from calendar date + clock time (local). */
function combineDeliveryAtMs(datePart: Date, timePart: Date): number {
  const out = new Date(datePart)
  out.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0)
  return out.getTime()
}

function bumpCans(current: string, delta: number): string {
  const base = parseInt(current, 10)
  const n = Number.isFinite(base) ? base : 1
  const next = Math.max(1, Math.min(500, n + delta))
  return String(next)
}

/** Simple 20L-style jar illustration (no image asset). */
function WaterCanVisual() {
  return (
    <View style={canVisualStyles.wrap}>
      <LinearGradient colors={['#67e8f9', '#22d3ee', '#0891b2']} style={canVisualStyles.cap} />
      <LinearGradient colors={['#e0f2fe', '#bae6fd', '#38bdf8']} style={canVisualStyles.body}>
        <View style={canVisualStyles.labelBand}>
          <Text style={canVisualStyles.label20}>20L</Text>
          <Text style={canVisualStyles.labelSub}>RO purified</Text>
        </View>
        <View style={canVisualStyles.droplet}>
          <Text style={canVisualStyles.dropletText}>💧</Text>
        </View>
      </LinearGradient>
      <View style={canVisualStyles.baseRing} />
    </View>
  )
}

const canVisualStyles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 120 },
  cap: {
    width: 44,
    height: 14,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: -2,
  },
  body: {
    width: 88,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  labelBand: {
    backgroundColor: 'rgba(6, 78, 59, 0.88)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  label20: { color: '#ecfdf5', fontWeight: '900', fontSize: 20 },
  labelSub: { color: '#a7f3d0', fontSize: 9, fontWeight: '700', marginTop: 2 },
  droplet: { marginTop: 10 },
  dropletText: { fontSize: 28 },
  baseRing: {
    marginTop: 6,
    width: 72,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 118, 110, 0.35)',
  },
})

function getCustomerCancelEligibility(o: Order): { allowed: boolean; reason?: string } {
  if (o.status !== 'booked') {
    return { allowed: false, reason: 'Only booked orders can be cancelled here.' }
  }
  if (o.deliveryAtMs == null || !Number.isFinite(o.deliveryAtMs)) {
    return { allowed: false, reason: 'Call us to cancel this order.' }
  }
  const cutoff = o.deliveryAtMs - CANCEL_CUTOFF_MS
  if (Date.now() >= cutoff) {
    return {
      allowed: false,
      reason: 'Cancellations are only allowed until 3 hours before your delivery time.',
    }
  }
  return { allowed: true }
}

const STORAGE_CUSTOMERS = 'mp-mobile-customers-v2'
const STORAGE_LOCATION_CHIPS = 'mp-mobile-location-chips-v1'
const ADMIN_PIN = '95385'

type ExpoExtra = { otpApiBaseUrl?: string; adminEmail?: string }

function readExpoExtra(): ExpoExtra {
  const e = Constants.expoConfig?.extra
  if (e && typeof e === 'object') return e as ExpoExtra
  return {}
}

/** API base from app.config.js `extra` (EAS / production) or EXPO_PUBLIC_* at bundle time. */
function getOtpApiBaseUrl(): string {
  const fromExtra = (readExpoExtra().otpApiBaseUrl ?? '').trim()
  const fromEnv = (process.env.EXPO_PUBLIC_OTP_API_BASE_URL ?? '').trim()
  return (fromExtra || fromEnv).replace(/\/$/, '')
}

function getAdminEmail(): string {
  const fromExtra = (readExpoExtra().adminEmail ?? '').trim().toLowerCase()
  const fromEnv = (process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? '').trim().toLowerCase()
  return fromExtra || fromEnv
}

async function parseResponseJson(res: Response): Promise<unknown | null> {
  const text = await res.text()
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

const THEME = {
  ink: '#052f3f',
  navy: '#0d2533',
  teal: '#0d9488',
  cyan: '#2dd4bf',
  sand: '#d4a574',
  mist: 'rgba(255,255,255,0.94)',
  white: '#ffffff',
  red: '#dc2626',
  /** Light water backdrop tones */
  waterDeep: '#0c4a6e',
  waterMid: '#0e7490',
  waterLight: '#e0f7fa',
  waterFoam: '#f0fdff',
}

const statusColor: Record<Status, string> = {
  booked: '#0d9488',
  in_progress: '#7c3aed',
  on_the_way: '#f59e0b',
  delivered: '#1d4ed8',
  cancelled: '#dc2626',
}

const statusLabel: Record<Status, string> = {
  booked: 'Order accepted',
  in_progress: 'Order in progress',
  on_the_way: 'Order on the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const ORDER_STATUS_FLOW: Status[] = ['booked', 'in_progress', 'on_the_way', 'delivered']

const BUSINESS = {
  name: 'MP Water Supply and Ro Plant',
  /** Matches public site title */
  tagline: 'Purified Water Supply',
  website: 'https://darshan1322.github.io/mp-water-ro-plant/',
  maps: 'https://share.google/WuTxw52JqRLS6tDR8',
  phone: '95385 86907',
  email: 'mpwatersupply.mandya@gmail.com',
  area: 'Mandya City & Villages',
}

/** Full brand artwork shown inside the classic droplet. */
const BRAND_LOGO_SOURCE = require('./assets/icon.png')

const DROP_VB_W = 100
const DROP_VB_H = 118
const DROP_PATH =
  'M 50 1.5 C 38 18 11 46 11 71 C 11 97 30 117 50 117 C 70 117 89 97 89 71 C 89 46 62 18 50 1.5 Z'

function BrandDropletMark({ outerW }: { outerW: number }) {
  const clipIdRef = useRef(`dropletClip-${Math.random().toString(36).slice(2, 10)}`)
  const clipId = clipIdRef.current
  const gradId = `${clipId}-g`

  const w = Math.max(Math.round(outerW), 70)
  const h = Math.round((w * DROP_VB_H) / DROP_VB_W)
  const logoUri = Image.resolveAssetSource(BRAND_LOGO_SOURCE)?.uri

  return (
    <View style={[brandDropStyles.svgWrap, { width: w, height: h }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${DROP_VB_W} ${DROP_VB_H}`}>
        <Defs>
          <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#e0f2fe" stopOpacity={1} />
            <Stop offset="35%" stopColor="#38bdf8" stopOpacity={1} />
            <Stop offset="100%" stopColor="#0369a1" stopOpacity={1} />
          </SvgLinearGradient>
          <ClipPath id={clipId}>
            <Path d={DROP_PATH} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Rect x={0} y={0} width={DROP_VB_W} height={DROP_VB_H} fill={`url(#${gradId})`} />
          {logoUri ? (
            <SvgImage
              href={{ uri: logoUri }}
              x={-7}
              y={3}
              width={116}
              height={116}
              preserveAspectRatio="xMidYMid meet"
            />
          ) : null}
        </G>
        <Path d={DROP_PATH} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} />
        <Path d={DROP_PATH} fill="none" stroke="rgba(3,105,161,0.35)" strokeWidth={0.9} />
      </Svg>
    </View>
  )
}

const brandDropStyles = StyleSheet.create({
  svgWrap: {
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0369a1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
})

const APP_FEATURES = [
  { title: 'User Friendly Interface', text: 'Simple screens for quick booking and tracking.' },
  { title: 'Scheduled Deliveries', text: 'Book based on your timing and need.' },
  { title: 'Hassle-Free Ordering', text: 'Order in a few taps from your phone.' },
  { title: 'Live Status Updates', text: 'Booked, Delivered, or Cancelled in real time.' },
]

const SERVICE_ITEMS = [
  { icon: '💧', label: '20L Water Cans' },
  { icon: '🚚', label: 'Doorstep Delivery' },
  { icon: '🏠', label: 'Homes & Offices' },
  { icon: '📍', label: 'Mandya Coverage' },
]

const ORDER_STEPS = ['Login', 'Set Profile', 'Schedule & Location', 'Book Order', 'Track Status']
const DELIVERY_SLOT_PRESETS = [
  { label: 'Morning', hour: 8, minute: 0 },
  { label: 'Noon', hour: 12, minute: 0 },
  { label: 'Evening', hour: 18, minute: 0 },
  { label: 'Night', hour: 20, minute: 0 },
]

const HERO_STATS = [
  { num: '20L', label: 'Sealed cans' },
  { num: 'RO', label: 'Purified' },
  { num: '24/7', label: 'Book anytime' },
]

const TESTIMONIALS = [
  {
    quote: 'Clean water and polite delivery — we order every week for our shop.',
    name: 'Ramesh · Mandya',
  },
  {
    quote: 'Easy to track status after booking. Very helpful for our home.',
    name: 'Lakshmi · Village route',
  },
]

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isNarrow = width < 390
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Record<string, CustomerProfile>>({})
  const [isReady, setIsReady] = useState(false)

  const [role, setRole] = useState<Role>('customer')
  const [activeTab, setActiveTab] = useState<AppTab>('home')

  const [email, setEmail] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [expectedOtp, setExpectedOtp] = useState('')
  const [otpRequestId, setOtpRequestId] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')

  const [adminPin, setAdminPin] = useState('')
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)

  const [profileName, setProfileName] = useState('')
  const [profileAddress, setProfileAddress] = useState('')

  const [orderCans, setOrderCans] = useState('1')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderDeliveryDateVal, setOrderDeliveryDateVal] = useState(() => defaultNextDeliveryDate())
  const [orderDeliveryTimeVal, setOrderDeliveryTimeVal] = useState(() => defaultDeliveryTime())
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false)
  const [showDeliveryTimePicker, setShowDeliveryTimePicker] = useState(false)
  const [orderDeliveryLocation, setOrderDeliveryLocation] = useState('')
  const [orderContactPhone, setOrderContactPhone] = useState('')
  const [locationChips, setLocationChips] = useState<string[]>([])

  useEffect(() => {
    async function loadStorage() {
      try {
        const [rawOrders, rawOrdersLegacy, rawCustomers, rawLocationChips] = await Promise.all([
          AsyncStorage.getItem(STORAGE_ORDERS),
          AsyncStorage.getItem(STORAGE_ORDERS_LEGACY),
          AsyncStorage.getItem(STORAGE_CUSTOMERS),
          AsyncStorage.getItem(STORAGE_LOCATION_CHIPS),
        ])
        const raw = rawOrders ?? rawOrdersLegacy
        if (raw) {
          const parsed = JSON.parse(raw) as unknown[]
          setOrders(parsed.map(normalizeOrder).filter((x): x is Order => x !== null))
        }
        if (rawCustomers) setCustomers(JSON.parse(rawCustomers) as Record<string, CustomerProfile>)
        if (rawLocationChips) setLocationChips(JSON.parse(rawLocationChips) as string[])
      } catch (error) {
        console.error('Storage load error', error)
      } finally {
        setIsReady(true)
      }
    }
    loadStorage()
  }, [])

  useEffect(() => {
    if (!isReady) return
    AsyncStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders)).catch(console.error)
  }, [orders, isReady])

  useEffect(() => {
    if (!isReady) return
    AsyncStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(customers)).catch(console.error)
  }, [customers, isReady])

  useEffect(() => {
    if (!isReady) return
    AsyncStorage.setItem(STORAGE_LOCATION_CHIPS, JSON.stringify(locationChips)).catch(console.error)
  }, [locationChips, isReady])

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true))
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const currentProfile = customerPhone ? customers[customerPhone] : undefined

  const customerOrders = useMemo(
    () => orders.filter((o) => o.phone === customerPhone).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, customerPhone]
  )

  const adminStats = useMemo(
    () => ({
      total: orders.length,
      booked: orders.filter((o) => o.status === 'booked').length,
      in_progress: orders.filter((o) => o.status === 'in_progress').length,
      on_the_way: orders.filter((o) => o.status === 'on_the_way').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }),
    [orders]
  )

  const customerStats = useMemo(
    () => ({
      total: customerOrders.length,
      booked: customerOrders.filter((o) => o.status === 'booked').length,
      in_progress: customerOrders.filter((o) => o.status === 'in_progress').length,
      on_the_way: customerOrders.filter((o) => o.status === 'on_the_way').length,
      delivered: customerOrders.filter((o) => o.status === 'delivered').length,
      cancelled: customerOrders.filter((o) => o.status === 'cancelled').length,
    }),
    [customerOrders]
  )

  const customerGraph = useMemo(() => {
    const max = Math.max(
      customerStats.booked,
      customerStats.in_progress,
      customerStats.on_the_way,
      customerStats.delivered,
      customerStats.cancelled,
      1
    )
    return [
      { key: 'Accepted', value: customerStats.booked, color: statusColor.booked, pct: (customerStats.booked / max) * 100 },
      {
        key: 'In progress',
        value: customerStats.in_progress,
        color: statusColor.in_progress,
        pct: (customerStats.in_progress / max) * 100,
      },
      {
        key: 'On the way',
        value: customerStats.on_the_way,
        color: statusColor.on_the_way,
        pct: (customerStats.on_the_way / max) * 100,
      },
      { key: 'Delivered', value: customerStats.delivered, color: statusColor.delivered, pct: (customerStats.delivered / max) * 100 },
      { key: 'Cancelled', value: customerStats.cancelled, color: statusColor.cancelled, pct: (customerStats.cancelled / max) * 100 },
    ]
  }, [customerStats])

  const adminGraph = useMemo(() => {
    const max = Math.max(adminStats.booked, adminStats.in_progress, adminStats.on_the_way, adminStats.delivered, adminStats.cancelled, 1)
    return [
      { key: 'Accepted', value: adminStats.booked, color: statusColor.booked, pct: (adminStats.booked / max) * 100 },
      { key: 'In progress', value: adminStats.in_progress, color: statusColor.in_progress, pct: (adminStats.in_progress / max) * 100 },
      { key: 'On the way', value: adminStats.on_the_way, color: statusColor.on_the_way, pct: (adminStats.on_the_way / max) * 100 },
      { key: 'Delivered', value: adminStats.delivered, color: statusColor.delivered, pct: (adminStats.delivered / max) * 100 },
      { key: 'Cancelled', value: adminStats.cancelled, color: statusColor.cancelled, pct: (adminStats.cancelled / max) * 100 },
    ]
  }, [adminStats])

  function sanitizePhone(value: string) {
    return value.replace(/[^0-9]/g, '').slice(0, 10)
  }

  function normalizeEmail(value: string) {
    return value.trim().toLowerCase()
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
  }

  function completeCustomerLogin(identifier: string) {
    const adminEmail = getAdminEmail()
    if (adminEmail && identifier === adminEmail) {
      setRole('admin')
      setAdminLoggedIn(true)
      setActiveTab('home')
      return
    }
    setCustomerPhone(identifier)
    setOtpInput('')
    setActiveTab('home')
  }

  async function sendOtp() {
    const cleanEmail = normalizeEmail(email)
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }
    setOtpBusy(true)
    try {
      const apiBase = getOtpApiBaseUrl()
      if (apiBase) {
        const res = await fetch(`${apiBase}/send-email-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        })
        const data = (await parseResponseJson(res)) as { success?: boolean; requestId?: string; message?: string } | null
        if (!data) {
          Alert.alert(
            'OTP failed',
            `No valid JSON from server (HTTP ${res.status}). Check OTP API URL and that otp-api is running.`,
          )
          return
        }
        if (!res.ok || !data?.success) {
          Alert.alert('OTP failed', data?.message ?? 'Unable to send OTP. Please try again.')
          return
        }
        setOtpRequestId(data.requestId ?? cleanEmail)
        setOtpSent(true)
        setEmail(cleanEmail)
        Alert.alert('OTP sent', data?.message ?? 'Please check your email and enter the OTP.')
        return
      }

      const generated = String(Math.floor(100000 + Math.random() * 900000))
      setExpectedOtp(generated)
      setOtpRequestId(cleanEmail)
      setOtpSent(true)
      setEmail(cleanEmail)
      Alert.alert('OTP sent (demo)', `Demo OTP: ${generated}`)
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      Alert.alert(
        'Network error',
        `Could not reach OTP API at:\n${getOtpApiBaseUrl() || '(not set)'}\n\nUse a public HTTPS URL in production, or your PC Wi‑Fi IP for testing (not localhost). Rebuild after changing env.\n\n${detail}`,
      )
    } finally {
      setOtpBusy(false)
    }
  }

  async function verifyOtp() {
    const cleanOtp = otpInput.trim()
    if (cleanOtp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the OTP received on your phone.')
      return
    }
    setOtpBusy(true)
    try {
      const apiBase = getOtpApiBaseUrl()
      if (apiBase) {
        const identifier = normalizeEmail(email)
        const res = await fetch(`${apiBase}/verify-email-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, otp: cleanOtp, requestId: otpRequestId }),
        })
        const data = (await parseResponseJson(res)) as { success?: boolean; message?: string } | null
        if (!data) {
          Alert.alert('Verify failed', `Bad response from server (HTTP ${res.status}).`)
          return
        }
        if (!res.ok || !data?.success) {
          Alert.alert('Wrong OTP', data?.message ?? 'Please enter correct OTP.')
          return
        }
        completeCustomerLogin(identifier)
        return
      }

      if (cleanOtp !== expectedOtp) {
        Alert.alert('Wrong OTP', 'Please enter correct OTP.')
        return
      }
      completeCustomerLogin(normalizeEmail(email))
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      Alert.alert('Network error', `Could not reach OTP API.\n${detail}`)
    } finally {
      setOtpBusy(false)
    }
  }

  function saveProfile() {
    if (!customerPhone) return
    if (!profileName.trim() || !profileAddress.trim()) {
      Alert.alert('Missing details', 'Please enter both name and address.')
      return
    }
    setCustomers((prev) => ({
      ...prev,
      [customerPhone]: {
        name: profileName.trim(),
        address: profileAddress.trim(),
      },
    }))
  }

  function onDeliveryDatePickerChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowDeliveryDatePicker(false)
      if (event.type === 'dismissed') return
    }
    if (date) setOrderDeliveryDateVal(date)
  }

  function onDeliveryTimePickerChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowDeliveryTimePicker(false)
      if (event.type === 'dismissed') return
    }
    if (date) setOrderDeliveryTimeVal(date)
  }

  function applyDeliverySlot(hour: number, minute: number) {
    const next = new Date(orderDeliveryDateVal)
    next.setHours(hour, minute, 0, 0)
    setOrderDeliveryTimeVal(next)
  }

  function addLocationChip(locationValue: string) {
    const clean = locationValue.trim()
    if (!clean) return
    setLocationChips((prev) => {
      const next = [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())]
      return next.slice(0, 6)
    })
  }

  function getTrackingMeta(status: Status) {
    if (status === 'booked') return { title: 'Order accepted', eta: 'Dispatch soon', color: '#0d9488' }
    if (status === 'in_progress') return { title: 'In progress', eta: 'Preparing your can', color: '#7c3aed' }
    if (status === 'on_the_way') return { title: 'On the way', eta: 'Arriving shortly', color: '#f59e0b' }
    if (status === 'delivered') return { title: 'Delivered', eta: 'Completed successfully', color: '#1d4ed8' }
    return { title: 'Cancelled', eta: 'Order closed', color: '#dc2626' }
  }

  async function notifyOrderStatusEmail(o: Order) {
    const apiBase = getOtpApiBaseUrl()
    if (!apiBase || !isValidEmail(o.phone)) return
    try {
      await fetch(`${apiBase}/send-order-status-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: o.phone,
          customerName: o.customerName,
          status: o.status,
          cans: o.cans,
          deliveryDate: o.deliveryDate,
          deliveryTime: o.deliveryTime,
          deliveryLocation: o.deliveryLocation,
        }),
      })
    } catch {
      // Keep ordering/status flow smooth even if email fails.
    }
  }

  function placeOrder() {
    if (!customerPhone || !currentProfile) return
    const cans = Number(orderCans)
    if (!Number.isFinite(cans) || cans < 1 || cans > 500) {
      Alert.alert('Invalid cans', 'Cans should be between 1 and 500.')
      return
    }
    const dLoc = orderDeliveryLocation.trim()
    const cPhone = sanitizePhone(orderContactPhone)
    if (!dLoc) {
      Alert.alert('Location', 'Please enter the delivery location for this order.')
      return
    }
    if (cPhone.length !== 10) {
      Alert.alert('Contact phone', 'Enter a valid 10-digit number we can call for this delivery.')
      return
    }
    const deliveryAtMs = combineDeliveryAtMs(orderDeliveryDateVal, orderDeliveryTimeVal)
    const dDate = formatOrderDateLabel(orderDeliveryDateVal)
    const dTime = formatOrderTimeLabel(orderDeliveryTimeVal)
    const order: Order = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phone: customerPhone,
      customerName: currentProfile.name,
      customerAddress: currentProfile.address,
      cans,
      notes: orderNotes.trim(),
      status: 'booked',
      createdAt: new Date().toISOString(),
      deliveryDate: dDate,
      deliveryTime: dTime,
      deliveryLocation: dLoc,
      contactPhone: cPhone,
      deliveryAtMs,
    }
    setOrders((prev) => [order, ...prev])
    void notifyOrderStatusEmail(order)
    addLocationChip(dLoc)
    setOrderCans('1')
    setOrderNotes('')
    setOrderDeliveryDateVal(defaultNextDeliveryDate())
    setOrderDeliveryTimeVal(defaultDeliveryTime())
    setOrderDeliveryLocation('')
    setOrderContactPhone(customerPhone)
    setShowDeliveryDatePicker(false)
    setShowDeliveryTimePicker(false)
    Alert.alert('Order placed', 'Your order is booked.')
  }

  function adminLogin() {
    if (adminPin !== ADMIN_PIN) {
      Alert.alert('Wrong PIN', 'Admin PIN is incorrect.')
      return
    }
    setAdminLoggedIn(true)
    setActiveTab('home')
  }

  function updateOrderStatus(id: string, status: Status) {
    const current = orders.find((o) => o.id === id)
    if (!current || current.status === status) return
    const nextOrder = { ...current, status }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    void notifyOrderStatusEmail(nextOrder)
  }

  function reorderFromPastOrder(o: Order) {
    setOrderCans(String(Math.max(1, o.cans || 1)))
    setOrderDeliveryLocation(o.deliveryLocation || currentProfile?.address || '')
    setOrderContactPhone(o.contactPhone || customerPhone)
    setOrderNotes(o.notes || '')
    setActiveTab('home')
  }

  function customerCancelOrder(orderId: string) {
    const o = orders.find((x) => x.id === orderId)
    if (!o || o.phone !== customerPhone) return
    const { allowed, reason } = getCustomerCancelEligibility(o)
    if (!allowed) {
      Alert.alert('Cannot cancel', reason ?? 'Unable to cancel this order.')
      return
    }
    Alert.alert('Cancel this order?', 'Your delivery slot will be released.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => updateOrderStatus(orderId, 'cancelled'),
      },
    ])
  }

  function resetToRoleSelection() {
    setRole('customer')
    setOtpSent(false)
    setEmail('')
    setOtpInput('')
    setExpectedOtp('')
    setOtpRequestId('')
    setCustomerPhone('')
    setProfileName('')
    setProfileAddress('')
    setOrderCans('1')
    setOrderNotes('')
    setOrderDeliveryDateVal(defaultNextDeliveryDate())
    setOrderDeliveryTimeVal(defaultDeliveryTime())
    setOrderDeliveryLocation('')
    setOrderContactPhone('')
    setShowDeliveryDatePicker(false)
    setShowDeliveryTimePicker(false)
    setAdminPin('')
    setAdminLoggedIn(false)
    setActiveTab('home')
  }

  const showCustomerApp = role === 'customer' && !!customerPhone && !!currentProfile
  const showAdminApp = role === 'admin' && adminLoggedIn
  const showTabBar = showCustomerApp || showAdminApp

  // Tab bar + SafeAreaView bottom edge handle the home indicator — keep scroll inset minimal.
  const scrollBottomPad = keyboardOpen
    ? Math.max(12, insets.bottom + 8)
    : showTabBar
      ? 4
      : Math.max(4, insets.bottom + 4)

  const layoutInnerW = Math.min(width, 560) - 28
  const heroDropOuterW = Math.min(Math.max(Math.round(layoutInnerW * 0.33), 84), 112)
  const settingsDropOuterW = Math.min(Math.max(Math.round(layoutInnerW * 0.22), 68), 90)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={[THEME.waterFoam, THEME.waterLight, '#b2ebf2', '#80deea']}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: scrollBottomPad,
              // Top inset already applied by SafeAreaView — only a small gap here
              paddingTop: 6,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.heroShell}>
          <LinearGradient
            colors={['#041a24', '#0c3d4d', '#0f766e', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroGlow} />
            <Pressable
              onPress={() => Linking.openURL(BUSINESS.website)}
              style={styles.heroBrandStack}
              accessibilityRole="link"
              accessibilityLabel={`${BUSINESS.name}, open website`}
            >
              <BrandDropletMark outerW={heroDropOuterW} />
              <View style={[styles.heroBrandTextWrap, styles.heroBrandTextWrapRow]}>
                <Text style={styles.heroBrandTitle}>{BUSINESS.name}</Text>
                <Text style={styles.heroBrandSub}>{BUSINESS.tagline}</Text>
                <Text style={styles.heroBrandTap}>Official site · tap</Text>
              </View>
            </Pressable>
            <Text style={styles.heroEyebrow}>Mandya · Trusted RO drinking water</Text>
            <Text style={styles.heroTitle}>Pure hydration</Text>
            <Text style={styles.heroTitleAccent}>at your fingertips</Text>
            <Text style={styles.heroLead}>
              One-stop 20L can delivery — book in seconds, track every order, same trusted quality.
            </Text>
            <View style={styles.heroStatsRow}>
              {HERO_STATS.map((s) => (
                <View key={s.label} style={styles.heroStatPill}>
                  <Text style={styles.heroStatNum}>{s.num}</Text>
                  <Text style={styles.heroStatLab}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.heroCta} onPress={() => setRole('customer')}>
              <LinearGradient colors={['#f0c995', '#d4a574', '#b8895a']} style={styles.heroCtaGrad}>
                <Text style={styles.heroCtaText}>Book now — Customer</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.contactFloatCard}>
          <View style={styles.contactFloatHead}>
            <Text style={styles.contactFloatEmoji}>💬</Text>
            <View style={styles.contactFloatHeadText}>
              <Text style={styles.contactFloatTitle}>Reach us</Text>
              <Text style={styles.contactFloatSub}>Quick support and booking help</Text>
            </View>
          </View>
          <Pressable style={styles.contactPrimaryBtn} onPress={() => Linking.openURL(BUSINESS.website)}>
            <Text style={styles.contactPrimaryBtnText}>Open Website</Text>
          </Pressable>
          <View style={styles.contactMiniGrid}>
            <Pressable style={styles.contactMiniCard} onPress={() => Linking.openURL(`tel:${BUSINESS.phone.replace(/\s/g, '')}`)}>
              <Text style={styles.contactMiniLabel}>📞 Call</Text>
              <Text style={styles.contactMiniValue}>{BUSINESS.phone}</Text>
            </Pressable>
            <Pressable style={styles.contactMiniCard} onPress={() => Linking.openURL(`mailto:${BUSINESS.email}`)}>
              <Text style={styles.contactMiniLabel}>✉️ Email</Text>
              <Text style={styles.contactMiniValue} numberOfLines={1}>{BUSINESS.email}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.contactAreaChip} onPress={() => Linking.openURL(BUSINESS.maps)}>
            <Text style={styles.contactAreaChipText}>📍 {BUSINESS.area}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(BUSINESS.maps)}>
            <Text style={styles.contactLink}>Open map location</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(BUSINESS.website)}>
            <Text style={styles.contactLink}>Official site · tap</Text>
          </Pressable>
        </View>

        {role === 'none' && (
          <View style={[styles.section, styles.sectionElevated]}>
            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>Get started</Text>
            </View>
            <Text style={styles.sectionTitleLarge}>Choose your access</Text>
            <Text style={styles.sectionSub}>Login with email OTP</Text>
            <View style={[styles.roleGrid, isNarrow && styles.roleGridStack]}>
              <Pressable style={styles.roleCard} onPress={() => setRole('customer')}>
                <Text style={styles.roleTitle}>Customer</Text>
                <Text style={styles.roleHint}>Login with email and OTP</Text>
              </Pressable>
            </View>

            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>What we offer</Text>
            </View>
            <Text style={styles.sectionTitleMid}>One stop for drinking water</Text>
            <View style={styles.serviceGrid}>
              {SERVICE_ITEMS.map((item) => (
                <View key={item.label} style={styles.serviceCardRich}>
                  <LinearGradient colors={['#f8fbfd', '#eef6f9']} style={styles.serviceCardInner}>
                    <Text style={styles.serviceIcon}>{item.icon}</Text>
                    <Text style={styles.serviceText}>{item.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>How it works</Text>
            </View>
            <Text style={styles.sectionTitleMid}>Order in just a few taps</Text>
            <View style={styles.stepsRow}>
              {ORDER_STEPS.map((step, i) => (
                <View key={step} style={styles.stepChip}>
                  <Text style={styles.stepIndex}>{i + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>Smart features</Text>
            </View>
            <Text style={styles.sectionTitleMid}>Built for clarity & speed</Text>
            <View style={styles.featureList}>
              {APP_FEATURES.map((feature) => (
                <View key={feature.title} style={styles.featureItemRich}>
                  <View style={styles.featureAccent} />
                  <View style={styles.featureBody}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>Trusted by locals</Text>
            </View>
            <Text style={styles.sectionTitleMid}>What people say</Text>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <Text style={styles.testimonialQuote}>“{t.quote}”</Text>
                <Text style={styles.testimonialName}>— {t.name}</Text>
              </View>
            ))}
          </View>
        )}

        {role === 'customer' && !customerPhone && (
          <View style={[styles.section, styles.sectionElevated]}>
            <View style={styles.loginInstaLogoRow}>
              <BrandDropletMark outerW={Math.min(96, Math.max(76, Math.round(layoutInnerW * 0.26)))} />
            </View>
            <Text style={styles.loginInstaTitle}>Login</Text>
            <Text style={styles.loginInstaSub}>Sign in with email OTP.</Text>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={(v) => setEmail(normalizeEmail(v))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email address"
              placeholderTextColor="#6b7280"
              style={[styles.input, styles.loginInstaInput]}
            />
            {!otpSent ? (
              <Pressable style={[styles.primaryBtn, styles.loginInstaBtn, otpBusy && styles.primaryBtnDisabled]} onPress={sendOtp} disabled={otpBusy}>
                <Text style={styles.primaryBtnText}>{otpBusy ? 'Sending OTP...' : 'Send OTP'}</Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Enter OTP</Text>
                <TextInput
                  value={otpInput}
                  onChangeText={(v) => setOtpInput(v.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="Enter OTP"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.loginInstaInput]}
                />
                <Pressable
                  style={[styles.primaryBtn, styles.loginInstaBtn, otpBusy && styles.primaryBtnDisabled]}
                  onPress={verifyOtp}
                  disabled={otpBusy}
                >
                  <Text style={styles.primaryBtnText}>{otpBusy ? 'Verifying...' : 'Verify OTP'}</Text>
                </Pressable>
                <Pressable style={styles.linkBtn} onPress={sendOtp} disabled={otpBusy}>
                  <Text style={styles.linkText}>Resend OTP</Text>
                </Pressable>
              </>
            )}
            <Pressable style={styles.linkBtn} onPress={resetToRoleSelection}>
              <Text style={styles.linkText}>Reset</Text>
            </Pressable>
          </View>
        )}

        {role === 'customer' && customerPhone && !currentProfile && (
          <View style={[styles.section, styles.sectionElevated]}>
            <Text style={styles.sectionTitleLarge}>Create your profile</Text>
            <Text style={styles.sectionSub}>Account: {customerPhone}</Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Your name"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              value={profileAddress}
              onChangeText={setProfileAddress}
              placeholder="Your address"
              placeholderTextColor="#6b7280"
              style={[styles.input, styles.notesInput]}
              multiline
            />
            <Pressable style={styles.primaryBtn} onPress={saveProfile}>
              <Text style={styles.primaryBtnText}>Save and Continue</Text>
            </Pressable>
          </View>
        )}

        {showCustomerApp && activeTab === 'home' && (
          <>
            <View style={[styles.section, styles.sectionElevated]}>
              <View style={styles.sectionKickerRow}>
                <View style={styles.kickerDot} />
                <Text style={styles.sectionKicker}>Your dashboard</Text>
              </View>
              <Text style={styles.sectionTitleLarge}>Hi, {currentProfile.name}</Text>
              <Text style={styles.helper}>{currentProfile.address}</Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{customerStats.total}</Text>
                  <Text style={styles.metricLabel}>Orders</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{customerStats.booked}</Text>
                  <Text style={styles.metricLabel}>Accepted</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{customerStats.in_progress}</Text>
                  <Text style={styles.metricLabel}>In progress</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{customerStats.on_the_way}</Text>
                  <Text style={styles.metricLabel}>On the way</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{customerStats.delivered}</Text>
                  <Text style={styles.metricLabel}>Delivered</Text>
                </View>
              </View>
              <Text style={styles.chartSectionLabel}>Activity overview</Text>
              <View style={styles.chartCardRich}>
                {customerGraph.map((item) => (
                  <View key={item.key} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{item.key}</Text>
                    <View style={styles.chartTrack}>
                      <View style={[styles.chartFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={styles.chartValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.bookingSectionLabel}>Top picks</Text>
              <View style={styles.offerRow}>
                <View style={styles.offerCard}>
                  <Text style={styles.offerTitle}>20L Can</Text>
                  <Text style={styles.offerSub}>Fresh RO drinking water</Text>
                  <Text style={styles.offerMeta}>Fast doorstep delivery</Text>
                </View>
                <View style={styles.offerCardAlt}>
                  <Text style={styles.offerTitle}>Quick Reorder</Text>
                  <Text style={styles.offerSub}>Same location, same can size</Text>
                  <Text style={styles.offerMeta}>Use from your order history</Text>
                </View>
              </View>
              <Text style={styles.bookingSectionLabel}>Delivery schedule & contact</Text>
              <Text style={styles.helperMuted}>
                Pick date & time below. You can cancel in the app until 3 hours before this delivery time.
              </Text>
              <View style={[styles.dateTimeRow, isNarrow && styles.dateTimeRowStack]}>
                <View style={styles.dateTimeHalf}>
                  <Text style={styles.fieldLabel}>Delivery date</Text>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.pickerField}
                    onPress={() => {
                      setShowDeliveryTimePicker(false)
                      setShowDeliveryDatePicker((v) => !v)
                    }}
                  >
                    <Text style={styles.pickerFieldText}>{formatOrderDateLabel(orderDeliveryDateVal)}</Text>
                    <Text style={styles.pickerFieldSub}>📅 Tap to choose date</Text>
                  </Pressable>
                  {showDeliveryDatePicker && (
                    <>
                      {Platform.OS === 'ios' ? (
                        <View style={styles.pickerIosWrap}>
                          <DateTimePicker
                            value={orderDeliveryDateVal}
                            mode="date"
                            display="inline"
                            minimumDate={startOfToday()}
                            themeVariant="light"
                            onChange={onDeliveryDatePickerChange}
                          />
                          <Pressable style={styles.pickerDoneRow} onPress={() => setShowDeliveryDatePicker(false)}>
                            <Text style={styles.pickerDoneText}>Done</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <DateTimePicker
                          value={orderDeliveryDateVal}
                          mode="date"
                          display="default"
                          minimumDate={startOfToday()}
                          onChange={onDeliveryDatePickerChange}
                        />
                      )}
                    </>
                  )}
                </View>
                <View style={styles.dateTimeHalf}>
                  <Text style={styles.fieldLabel}>Delivery time</Text>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.pickerField}
                    onPress={() => {
                      setShowDeliveryDatePicker(false)
                      setShowDeliveryTimePicker((v) => !v)
                    }}
                  >
                    <Text style={styles.pickerFieldText}>{formatOrderTimeLabel(orderDeliveryTimeVal)}</Text>
                    <Text style={styles.pickerFieldSub}>🕐 Tap to choose time</Text>
                  </Pressable>
                  {showDeliveryTimePicker && (
                    <>
                      {Platform.OS === 'ios' ? (
                        <View style={styles.pickerIosWrap}>
                          <DateTimePicker
                            value={orderDeliveryTimeVal}
                            mode="time"
                            display="spinner"
                            themeVariant="light"
                            onChange={onDeliveryTimePickerChange}
                          />
                          <Pressable style={styles.pickerDoneRow} onPress={() => setShowDeliveryTimePicker(false)}>
                            <Text style={styles.pickerDoneText}>Done</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <DateTimePicker
                          value={orderDeliveryTimeVal}
                          mode="time"
                          display="default"
                          is24Hour={false}
                          onChange={onDeliveryTimePickerChange}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
              <View style={styles.slotRow}>
                {DELIVERY_SLOT_PRESETS.map((slot) => (
                  <Pressable key={slot.label} style={styles.slotChip} onPress={() => applyDeliverySlot(slot.hour, slot.minute)}>
                    <Text style={styles.slotChipText}>{slot.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Delivery location</Text>
              <TextInput
                value={orderDeliveryLocation}
                onChangeText={setOrderDeliveryLocation}
                placeholder="Full address, landmark, or area for this delivery"
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.notesInput]}
                multiline
              />
              {locationChips.length > 0 ? (
                <View style={styles.savedLocationRow}>
                  {locationChips.map((loc) => (
                    <Pressable key={loc} style={styles.savedLocationChip} onPress={() => setOrderDeliveryLocation(loc)}>
                      <Text style={styles.savedLocationChipText} numberOfLines={1}>
                        📍 {loc}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.fieldLabel}>Contact phone (for this order)</Text>
              <TextInput
                value={orderContactPhone}
                onChangeText={(v) => setOrderContactPhone(sanitizePhone(v))}
                placeholder="10-digit number to reach you"
                placeholderTextColor="#6b7280"
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Quantity · 20L cans</Text>
              <View style={styles.canStepperCard}>
                <View style={styles.canStepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease cans"
                    style={[
                      styles.stepperBtn,
                      (parseInt(orderCans, 10) || 1) <= 1 && styles.stepperBtnDisabled,
                    ]}
                    disabled={(parseInt(orderCans, 10) || 1) <= 1}
                    onPress={() => setOrderCans((prev) => bumpCans(prev, -1))}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <View style={styles.canStepperCenter}>
                    <WaterCanVisual />
                    <Text style={styles.canQtyBig}>{parseInt(orderCans, 10) || 1}</Text>
                    <Text style={styles.canQtyUnit}>cans in cart</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase cans"
                    style={[
                      styles.stepperBtn,
                      (parseInt(orderCans, 10) || 1) >= 500 && styles.stepperBtnDisabled,
                    ]}
                    disabled={(parseInt(orderCans, 10) || 1) >= 500}
                    onPress={() => setOrderCans((prev) => bumpCans(prev, 1))}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.canStepperHint}>Tap + / − like a store app · max 500 cans</Text>
              </View>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                value={orderNotes}
                onChangeText={setOrderNotes}
                placeholder="Notes (optional)"
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.notesInput]}
                multiline
              />
              <Pressable style={styles.primaryBtnWrap} onPress={placeOrder}>
                <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.primaryBtnGrad}>
                  <Text style={styles.primaryBtnText}>Book order now</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}

        {showCustomerApp && activeTab === 'orders' && (
          <View style={[styles.section, styles.sectionElevated]}>
            <Text style={styles.sectionTitleLarge}>Your orders</Text>
            {customerOrders.length === 0 ? (
              <Text style={styles.emptyText}>No orders yet.</Text>
            ) : (
              customerOrders.map((o) => {
                const cancelEl = o.status === 'booked' ? getCustomerCancelEligibility(o) : null
                const tracking = getTrackingMeta(o.status)
                return (
                  <View key={o.id} style={[styles.orderCard, styles.orderCardRich]}>
                    <View style={styles.orderTop}>
                      <Text style={styles.orderName}>{o.cans} cans</Text>
                      <Text style={[styles.statusBadge, { backgroundColor: statusColor[o.status] }]}>
                        {statusLabel[o.status].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.orderInfo}>Placed: {new Date(o.createdAt).toLocaleString()}</Text>
                    {o.deliveryDate ? (
                      <Text style={styles.orderInfo}>
                        When: {o.deliveryDate}
                        {o.deliveryTime ? ` · ${o.deliveryTime}` : ''}
                      </Text>
                    ) : null}
                    {o.deliveryLocation ? (
                      <Text style={styles.orderInfo}>Location: {o.deliveryLocation}</Text>
                    ) : null}
                    {o.contactPhone ? (
                      <Text style={styles.orderInfo}>Contact: {o.contactPhone}</Text>
                    ) : null}
                    {o.notes ? <Text style={styles.orderInfo}>Note: {o.notes}</Text> : null}
                    <View style={[styles.trackingMetaCard, { borderColor: tracking.color }]}>
                      <Text style={[styles.trackingMetaTitle, { color: tracking.color }]}>{tracking.title}</Text>
                      <Text style={styles.trackingMetaEta}>{tracking.eta}</Text>
                    </View>
                    <View style={styles.timelineRow}>
                      {ORDER_STATUS_FLOW.map((step, idx) => {
                        const currentIdx = ORDER_STATUS_FLOW.indexOf(o.status as Status)
                        const isDone = o.status === 'cancelled' ? step === 'booked' : idx <= currentIdx
                        return (
                          <View key={step} style={styles.timelineItem}>
                            <View style={[styles.timelineDot, isDone && { backgroundColor: statusColor[step] }]} />
                            <Text style={[styles.timelineText, isDone && styles.timelineTextActive]} numberOfLines={1}>
                              {statusLabel[step].replace('Order ', '')}
                            </Text>
                          </View>
                        )
                      })}
                    </View>
                    {cancelEl?.allowed ? (
                      <Pressable style={styles.customerCancelBtn} onPress={() => customerCancelOrder(o.id)}>
                        <Text style={styles.customerCancelBtnText}>Cancel order</Text>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.reorderBtn} onPress={() => reorderFromPastOrder(o)}>
                      <Text style={styles.reorderBtnText}>Reorder this</Text>
                    </Pressable>
                    {cancelEl && !cancelEl.allowed ? (
                      <Text style={styles.cancelBlockedHint}>{cancelEl.reason}</Text>
                    ) : null}
                  </View>
                )
              })
            )}
          </View>
        )}

        {showCustomerApp && activeTab === 'profile' && (
          <View style={[styles.section, styles.sectionElevated]}>
            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>Account</Text>
            </View>
            <Text style={styles.sectionTitleLarge}>Your profile</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileAvatar}>👤</Text>
              <View style={styles.profileCardBody}>
                <Text style={styles.profileName}>{currentProfile?.name}</Text>
                <Text style={styles.orderInfo}>
                  {customerPhone.includes('@') ? '📧' : '📱'} {customerPhone}
                </Text>
                <Text style={styles.orderInfo}>📍 {currentProfile?.address}</Text>
              </View>
            </View>
            <Pressable style={styles.settingsRowLite} onPress={() => setActiveTab('settings')}>
              <Text style={styles.settingsRowIcon}>⚙️</Text>
              <Text style={styles.settingsRowText}>Help, contact & sign out → Settings</Text>
            </Pressable>
          </View>
        )}

        {showCustomerApp && activeTab === 'settings' && (
          <View style={[styles.section, styles.sectionElevated]}>
            <LinearGradient colors={['#0e7490', '#14b8a6', '#2dd4bf']} style={styles.settingsHero}>
              <Pressable
                style={styles.settingsBrandCompact}
                onPress={() => Linking.openURL(BUSINESS.website)}
                accessibilityRole="link"
                accessibilityLabel={`${BUSINESS.name}, website`}
              >
                <BrandDropletMark outerW={settingsDropOuterW} />
                <View style={styles.heroBrandTextWrap}>
                  <Text style={styles.settingsHeroBrandOnTeal}>{BUSINESS.name}</Text>
                  <Text style={styles.settingsHeroSubOnTeal}>{BUSINESS.tagline}</Text>
                </View>
              </Pressable>
              <Text style={styles.settingsHeroTitle}>Settings</Text>
              <Text style={styles.settingsHeroSub}>Account, contact & website</Text>
            </LinearGradient>
            <Text style={styles.settingsGroupLabel}>Reach us</Text>
            <Pressable
              style={styles.settingsRow}
              onPress={() => Linking.openURL(`tel:${BUSINESS.phone.replace(/\s/g, '')}`)}
            >
              <Text style={styles.settingsRowEmoji}>📞</Text>
              <View style={styles.settingsRowMain}>
                <Text style={styles.settingsRowTitle}>Call</Text>
                <Text style={styles.settingsRowSub}>{BUSINESS.phone}</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => Linking.openURL(`mailto:${BUSINESS.email}`)}>
              <Text style={styles.settingsRowEmoji}>✉️</Text>
              <View style={styles.settingsRowMain}>
                <Text style={styles.settingsRowTitle}>Email</Text>
                <Text style={styles.settingsRowSub}>{BUSINESS.email}</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => Linking.openURL(BUSINESS.website)}>
              <Text style={styles.settingsRowEmoji}>🌐</Text>
              <View style={styles.settingsRowMain}>
                <Text style={styles.settingsRowTitle}>Website</Text>
                <Text style={styles.settingsRowSub} numberOfLines={1}>
                  {BUSINESS.website.replace(/^https?:\/\//, '')}
                </Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
            <Text style={styles.settingsGroupLabel}>App</Text>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowEmoji}>💧</Text>
              <View style={styles.settingsRowMain}>
                <Text style={styles.settingsRowTitle}>Version</Text>
                <Text style={styles.settingsRowSub}>1.0 · RO can delivery</Text>
              </View>
            </View>
            <Pressable style={[styles.primaryBtn, styles.secondaryBtn, styles.settingsLogout]} onPress={resetToRoleSelection}>
              <Text style={styles.primaryBtnText}>Sign out</Text>
            </Pressable>
          </View>
        )}

        {role === 'admin' && !adminLoggedIn && (
          <View style={[styles.section, styles.sectionElevated]}>
            <View style={styles.loginInstaLogoRow}>
              <BrandDropletMark outerW={Math.min(88, Math.max(72, Math.round(layoutInnerW * 0.22)))} />
            </View>
            <Text style={styles.sectionTitleLarge}>Admin access</Text>
            <Text style={styles.sectionSub}>Only your team should access this area.</Text>
            <Text style={styles.fieldLabel}>Admin PIN</Text>
            <TextInput
              value={adminPin}
              onChangeText={(v) => setAdminPin(v.replace(/[^0-9]/g, '').slice(0, 6))}
              secureTextEntry
              keyboardType="number-pad"
              placeholder="Enter admin PIN"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
            <Pressable style={styles.primaryBtn} onPress={adminLogin}>
              <Text style={styles.primaryBtnText}>Login as Admin</Text>
            </Pressable>
            <Text style={styles.helper}>Demo PIN: 95385</Text>
            <Pressable style={styles.linkBtn} onPress={resetToRoleSelection}>
              <Text style={styles.linkText}>Back</Text>
            </Pressable>
          </View>
        )}

        {showAdminApp && activeTab === 'home' && (
          <View style={[styles.section, styles.sectionElevated]}>
            <View style={styles.sectionKickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.sectionKicker}>Staff overview</Text>
            </View>
            <Text style={styles.sectionTitleLarge}>Today at a glance</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{adminStats.total}</Text>
                <Text style={styles.metricLabel}>Total</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{adminStats.booked}</Text>
                <Text style={styles.metricLabel}>Booked</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{adminStats.delivered}</Text>
                <Text style={styles.metricLabel}>Delivered</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{adminStats.cancelled}</Text>
                <Text style={styles.metricLabel}>Cancelled</Text>
              </View>
            </View>
            <Text style={styles.chartSectionLabel}>Pipeline overview</Text>
            <View style={styles.chartCardRich}>
              {adminGraph.map((item) => (
                <View key={item.key} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{item.key}</Text>
                  <View style={styles.chartTrack}>
                    <View style={[styles.chartFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.chartValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.primaryBtnWrap} onPress={() => setActiveTab('orders')}>
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.primaryBtnGrad}>
                <Text style={styles.primaryBtnText}>Open order queue →</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {showAdminApp && (activeTab === 'orders' || activeTab === 'admin') && (
          <>
            <View style={[styles.section, styles.sectionElevated]}>
              <Text style={styles.sectionTitleLarge}>Order queue</Text>
              <Text style={styles.sectionSub}>Update status per delivery — newest first</Text>
              {orders.length === 0 ? (
                <Text style={styles.emptyText}>No orders found.</Text>
              ) : (
                orders
                  .slice()
                  .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                  .map((o) => (
                    <View key={o.id} style={[styles.orderCard, styles.orderCardRich]}>
                      <View style={styles.orderTop}>
                        <Text style={styles.orderName}>{o.customerName}</Text>
                        <Text style={[styles.statusBadge, { backgroundColor: statusColor[o.status] }]}>
                          {statusLabel[o.status].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.orderInfo}>Account phone: {o.phone}</Text>
                      <Text style={styles.orderInfo}>Profile address: {o.customerAddress}</Text>
                      {o.deliveryDate || o.deliveryTime ? (
                        <Text style={styles.orderInfo}>
                          Preferred: {o.deliveryDate || '—'}
                          {o.deliveryTime ? ` · ${o.deliveryTime}` : ''}
                        </Text>
                      ) : null}
                      {o.deliveryLocation ? (
                        <Text style={styles.orderInfo}>Delivery location: {o.deliveryLocation}</Text>
                      ) : null}
                      {o.contactPhone ? (
                        <Text style={styles.orderInfo}>Call for delivery: {o.contactPhone}</Text>
                      ) : null}
                      <Text style={styles.orderInfo}>Cans: {o.cans}</Text>
                      <Text style={styles.orderInfo}>Placed: {new Date(o.createdAt).toLocaleString()}</Text>
                      {o.notes ? <Text style={styles.orderInfo}>Note: {o.notes}</Text> : null}

                      <View style={styles.actionRow}>
                        <Pressable style={[styles.actionBtn, styles.bookedBtn]} onPress={() => updateOrderStatus(o.id, 'booked')}>
                          <Text style={styles.actionText}>Accepted</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.inProgressBtn]}
                          onPress={() => updateOrderStatus(o.id, 'in_progress')}
                        >
                          <Text style={styles.actionText}>In progress</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.onTheWayBtn]}
                          onPress={() => updateOrderStatus(o.id, 'on_the_way')}
                        >
                          <Text style={styles.actionText}>On the way</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.deliveredBtn]}
                          onPress={() => updateOrderStatus(o.id, 'delivered')}
                        >
                          <Text style={styles.actionText}>Delivered</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.cancelBtn]}
                          onPress={() => updateOrderStatus(o.id, 'cancelled')}
                        >
                          <Text style={styles.actionText}>Cancelled</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
              )}
            </View>
            <Pressable style={[styles.primaryBtn, styles.secondaryBtn]} onPress={resetToRoleSelection}>
              <Text style={styles.primaryBtnText}>Logout</Text>
            </Pressable>
          </>
        )}

        {showAdminApp && activeTab === 'settings' && (
          <View style={[styles.section, styles.sectionElevated]}>
            <LinearGradient colors={['#0c4a6e', '#0e7490', '#155e75']} style={styles.settingsHero}>
              <Pressable
                style={styles.settingsBrandCompact}
                onPress={() => Linking.openURL(BUSINESS.website)}
                accessibilityRole="link"
              >
                <BrandDropletMark outerW={settingsDropOuterW} />
                <View style={styles.heroBrandTextWrap}>
                  <Text style={styles.settingsHeroBrandOnTeal}>{BUSINESS.name}</Text>
                  <Text style={styles.settingsHeroSubOnTeal}>{BUSINESS.tagline}</Text>
                </View>
              </Pressable>
              <Text style={styles.settingsHeroTitle}>Staff settings</Text>
              <Text style={styles.settingsHeroSub}>Shortcuts & sign out</Text>
            </LinearGradient>
            <Text style={styles.settingsGroupLabel}>Business</Text>
            <Pressable
              style={styles.settingsRow}
              onPress={() => Linking.openURL(`tel:${BUSINESS.phone.replace(/\s/g, '')}`)}
            >
              <Text style={styles.settingsRowEmoji}>📞</Text>
              <View style={styles.settingsRowMain}>
                <Text style={styles.settingsRowTitle}>Customer care</Text>
                <Text style={styles.settingsRowSub}>{BUSINESS.phone}</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
            <Pressable style={styles.settingsRow} onPress={() => Linking.openURL(BUSINESS.website)}>
              <Text style={styles.settingsRowEmoji}>🌐</Text>
              <View style={styles.settingsRowMain}>
                <Text style={styles.settingsRowTitle}>Website</Text>
                <Text style={styles.settingsRowSub} numberOfLines={1}>
                  {BUSINESS.website.replace(/^https?:\/\//, '')}
                </Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
            <Pressable style={[styles.primaryBtn, styles.secondaryBtn, styles.settingsLogout]} onPress={resetToRoleSelection}>
              <Text style={styles.primaryBtnText}>Sign out (staff)</Text>
            </Pressable>
          </View>
        )}
        </ScrollView>

      {showTabBar && (
        <View style={styles.tabBarDock}>
          <LinearGradient
            colors={['#042f3d', '#064e5b', '#0a5c6b']}
            style={styles.tabBarGradient}
          >
            <View style={styles.tabBarTopAccent} />
            {(showCustomerApp
              ? [
                  { key: 'home' as AppTab, label: 'Home', icon: '🏠' },
                  { key: 'orders' as AppTab, label: 'Orders', icon: '📦' },
                  { key: 'profile' as AppTab, label: 'Profile', icon: '👤' },
                  { key: 'settings' as AppTab, label: 'Settings', icon: '⚙️' },
                ]
              : [
                  { key: 'home' as AppTab, label: 'Home', icon: '📊' },
                  { key: 'orders' as AppTab, label: 'Orders', icon: '📋' },
                  { key: 'settings' as AppTab, label: 'Settings', icon: '⚙️' },
                  { key: 'admin' as AppTab, label: 'Manage', icon: '✓' },
                ]
            ).map((tab) => {
              const active = activeTab === tab.key
              return (
                <Pressable
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={tab.label}
                >
                  <View style={[styles.tabIconBubble, active && styles.tabIconBubbleActive]}>
                    <Text style={styles.tabEmoji}>{tab.icon}</Text>
                  </View>
                  <Text style={[styles.tabLabelCreative, active && styles.tabLabelCreativeActive]}>{tab.label}</Text>
                  {active ? <View style={styles.tabActiveDot} /> : <View style={styles.tabActiveDotPlaceholder} />}
                </Pressable>
              )
            })}
          </LinearGradient>
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.waterLight },
  keyboardAvoid: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 14, gap: 10, alignSelf: 'center', width: '100%', maxWidth: 560 },

  heroShell: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: -16,
    ...Platform.select({
      ios: {
        shadowColor: '#03141c',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  heroGradient: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBrandStack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 12,
    paddingVertical: 6,
    alignSelf: 'stretch',
  },
  heroBrandTextWrapRow: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 4,
  },
  heroBrandTextWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  heroBrandTitle: {
    color: THEME.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  heroBrandSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'left',
  },
  heroBrandTap: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'left',
  },
  settingsBrandCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.22)',
  },
  settingsHeroBrandOnTeal: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  settingsHeroSubOnTeal: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  heroTitle: { color: THEME.white, fontSize: 30, fontWeight: '900', lineHeight: 36 },
  heroTitleAccent: {
    color: '#fef3c7',
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  heroLead: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    maxWidth: 340,
  },
  heroStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  heroStatPill: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatNum: { color: '#fef9c3', fontSize: 16, fontWeight: '900' },
  heroStatLab: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  heroCta: { borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start' },
  heroCtaGrad: { paddingVertical: 14, paddingHorizontal: 22 },
  heroCtaText: { color: '#1a1208', fontWeight: '900', fontSize: 15, textAlign: 'center' },

  contactFloatCard: {
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: '#f8feff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bde4f1',
    ...Platform.select({
      ios: {
        shadowColor: '#06222a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
    }),
  },
  contactFloatHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactFloatEmoji: { fontSize: 26 },
  contactFloatHeadText: { flex: 1 },
  contactFloatTitle: { color: '#062c22', fontWeight: '900', fontSize: 17 },
  contactFloatSub: { color: '#4f6d7b', fontSize: 12, marginTop: 2 },
  contactPrimaryBtn: {
    backgroundColor: '#0ea5a6',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 10,
  },
  contactPrimaryBtnText: { color: '#f8ffff', fontWeight: '900', fontSize: 14 },
  contactMiniGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  contactMiniCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8ebf4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  contactMiniLabel: { color: '#0f5e68', fontSize: 11, fontWeight: '800' },
  contactMiniValue: { color: '#12384d', fontSize: 12, fontWeight: '700', marginTop: 4 },
  contactAreaChip: {
    backgroundColor: '#e0f7fa',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#b9e3ee',
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  contactAreaChipText: { color: '#0e5a63', fontSize: 12, fontWeight: '800' },
  contactLink: { color: '#0d9488', fontWeight: '800', fontSize: 13, marginBottom: 2 },
  infoLineMuted: { color: '#4d687a', fontSize: 12, lineHeight: 18 },

  sectionElevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#0a1f2e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  sectionKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14b8a6',
  },
  sectionKicker: {
    color: '#0d9488',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitleLarge: { color: '#0a1a24', fontWeight: '900', fontSize: 22, marginBottom: 4 },
  sectionTitleMid: { color: '#12384d', fontWeight: '800', fontSize: 17, marginBottom: 8 },

  serviceCardRich: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0a2540',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  serviceCardInner: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
  },

  featureItemRich: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e5ee',
    overflow: 'hidden',
  },
  featureAccent: {
    width: 4,
    backgroundColor: '#14b8a6',
  },
  featureBody: { flex: 1, padding: 12 },

  testimonialCard: {
    backgroundColor: '#f7fbfa',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#d4a574',
    marginBottom: 4,
  },
  testimonialQuote: { color: '#1c3b4f', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  testimonialName: { color: '#0d9488', fontWeight: '800', fontSize: 12, marginTop: 8 },

  primaryBtnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  primaryBtnGrad: { paddingVertical: 14, alignItems: 'center' },

  chartSectionLabel: { color: '#1c3b4f', fontSize: 13, fontWeight: '800', marginTop: 6, marginBottom: 6 },
  chartCardRich: {
    backgroundColor: '#f8fbfd',
    borderColor: '#c8dce8',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  orderCardRich: {
    ...Platform.select({
      ios: {
        shadowColor: '#0a1f2e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  section: {
    backgroundColor: THEME.mist,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2ebf0',
  },
  sectionTitle: { color: '#0f2533', fontWeight: '800', fontSize: 16, marginBottom: 2 },
  subSectionTitle: { marginTop: 6 },
  sectionSub: { color: '#4d687a', fontSize: 12, marginBottom: 4 },
  helper: { color: '#37556b', fontSize: 12 },
  helperMuted: { color: '#5a7284', fontSize: 11, lineHeight: 16, marginBottom: 6 },
  infoLine: { color: '#224255', fontSize: 12, lineHeight: 18 },
  fieldLabel: { color: '#1c3b4f', fontSize: 12, fontWeight: '700', marginTop: 2 },
  bookingSectionLabel: {
    color: '#0a1a24',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateTimeRowStack: { flexDirection: 'column' },
  dateTimeHalf: { flex: 1, minWidth: 0 },
  pickerField: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8dce8',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  pickerFieldText: { color: '#0f2533', fontSize: 16, fontWeight: '800' },
  pickerFieldSub: { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 4 },
  pickerIosWrap: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  pickerDoneRow: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0d9488',
  },
  pickerDoneText: { color: THEME.white, fontWeight: '800', fontSize: 16 },
  input: {
    backgroundColor: THEME.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d2dbe2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#10202c',
  },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: THEME.teal,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  secondaryBtn: {
    backgroundColor: '#1f4060',
  },
  primaryBtnText: { color: THEME.white, fontWeight: '800', fontSize: 15 },
  loginInstaLogoRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  loginInstaTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  loginInstaSub: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  loginInstaInput: {
    borderRadius: 14,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  loginInstaBtn: {
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: '#0095f6',
  },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: '#0f7486', fontWeight: '700' },
  emptyText: { color: '#516373', fontSize: 13 },
  roleGrid: { flexDirection: 'row', gap: 10 },
  roleGridStack: { flexDirection: 'column' },
  roleCard: {
    flex: 1,
    backgroundColor: '#0d9488',
    borderRadius: 14,
    padding: 14,
  },
  roleCardAlt: {
    backgroundColor: '#1a5674',
  },
  roleTitle: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: '800',
  },
  roleHint: {
    color: '#d9f8f5',
    marginTop: 4,
    fontSize: 12,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5e3eb',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  serviceIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  serviceText: {
    color: '#204459',
    fontSize: 12,
    fontWeight: '700',
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e7f7f5',
    borderWidth: 1,
    borderColor: '#cce9e4',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stepIndex: {
    color: '#0b6d64',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    color: '#0f4456',
    fontSize: 11,
    fontWeight: '700',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e5ee',
    borderRadius: 12,
    padding: 10,
  },
  featureTitle: {
    color: '#12384d',
    fontSize: 13,
    fontWeight: '800',
  },
  featureText: {
    color: '#456173',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  metricsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metricCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d4e3ec',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  metricValue: {
    color: '#0f2533',
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#486073',
    fontSize: 11,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d4e3ec',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLabel: {
    width: 64,
    fontSize: 11,
    color: '#37556b',
    fontWeight: '700',
  },
  chartTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e3edf4',
    borderRadius: 999,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 999,
  },
  chartValue: {
    width: 24,
    textAlign: 'right',
    fontSize: 11,
    color: '#37556b',
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: '#d4dde5',
    borderRadius: 14,
    padding: 12,
    gap: 5,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderName: { color: '#0c2230', fontSize: 15, fontWeight: '800', maxWidth: '65%' },
  orderInfo: { color: '#30495b', fontSize: 12, lineHeight: 17 },
  statusBadge: {
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  actionRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
  actionBtn: { flex: 1, borderRadius: 9, paddingVertical: 9, alignItems: 'center' },
  bookedBtn: { backgroundColor: '#0d9488' },
  inProgressBtn: { backgroundColor: '#7c3aed' },
  onTheWayBtn: { backgroundColor: '#f59e0b' },
  deliveredBtn: { backgroundColor: '#1d4ed8' },
  cancelBtn: { backgroundColor: THEME.red },
  actionText: { color: THEME.white, fontWeight: '700', fontSize: 12 },
  offerRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  offerCard: {
    flex: 1,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 10,
  },
  offerCardAlt: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 10,
  },
  offerTitle: { color: '#0f172a', fontSize: 13, fontWeight: '900' },
  offerSub: { color: '#1e3a4d', fontSize: 11, fontWeight: '700', marginTop: 4 },
  offerMeta: { color: '#4f6b7a', fontSize: 10, marginTop: 5 },
  timelineRow: { flexDirection: 'row', marginTop: 8, marginBottom: 2, gap: 6 },
  timelineItem: { flex: 1, alignItems: 'center' },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
    marginBottom: 4,
  },
  timelineText: { color: '#7c8b98', fontSize: 9, fontWeight: '700' },
  timelineTextActive: { color: '#0f172a' },
  trackingMetaCard: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  trackingMetaTitle: { fontSize: 12, fontWeight: '900' },
  trackingMetaEta: { color: '#4f6473', fontSize: 11, marginTop: 2 },
  customerCancelBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  customerCancelBtnText: { color: '#b91c1c', fontWeight: '800', fontSize: 13 },
  reorderBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  reorderBtnText: { color: '#166534', fontWeight: '800', fontSize: 13 },
  cancelBlockedHint: {
    marginTop: 8,
    color: '#7a8b99',
    fontSize: 11,
    lineHeight: 16,
  },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 },
  slotChip: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  slotChipText: { color: '#0c4a6e', fontSize: 11, fontWeight: '800' },
  savedLocationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 2 },
  savedLocationChip: {
    maxWidth: '100%',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  savedLocationChipText: { color: '#1e3a4d', fontSize: 11, fontWeight: '700' },
  canStepperCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  canStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  canStepperCenter: { flex: 1, alignItems: 'center', minWidth: 0 },
  canQtyBig: {
    color: '#0f766e',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  canQtyUnit: { color: '#0d9488', fontSize: 12, fontWeight: '700', marginTop: 2 },
  canStepperHint: {
    textAlign: 'center',
    color: '#5b7a8c',
    fontSize: 11,
    marginTop: 12,
  },
  stepperBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  stepperBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.85,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  stepperBtnText: {
    color: THEME.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
  profileCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e3ec',
    padding: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  profileAvatar: {
    fontSize: 40,
    width: 56,
    height: 56,
    textAlign: 'center',
    lineHeight: 56,
    backgroundColor: '#e0f2fe',
    borderRadius: 28,
    overflow: 'hidden',
  },
  profileCardBody: { flex: 1, gap: 4 },
  profileName: { color: '#0a1a24', fontSize: 18, fontWeight: '900' },
  settingsRowLite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  settingsRowIcon: { fontSize: 20 },
  settingsRowText: { flex: 1, color: '#0e7490', fontWeight: '700', fontSize: 13 },
  settingsHero: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  settingsHeroTitle: { color: THEME.white, fontSize: 20, fontWeight: '900' },
  settingsHeroSub: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 6, lineHeight: 17 },
  settingsGroupLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },
  settingsRowEmoji: { fontSize: 22 },
  settingsRowMain: { flex: 1, minWidth: 0 },
  settingsRowTitle: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  settingsRowSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  settingsChevron: { color: '#94a3b8', fontSize: 22, fontWeight: '300' },
  settingsLogout: { marginTop: 16 },
  tabBarDock: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  tabBarGradient: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 2,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 212, 191, 0.35)',
  },
  tabBarTopAccent: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'rgba(45, 212, 191, 0.5)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
    minWidth: 0,
  },
  tabIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabIconBubbleActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.45)',
    borderColor: 'rgba(45, 212, 191, 0.55)',
  },
  tabEmoji: { fontSize: 19 },
  tabLabelCreative: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelCreativeActive: {
    color: '#5eead4',
  },
  tabActiveDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2dd4bf',
    marginTop: 2,
  },
  tabActiveDotPlaceholder: {
    width: 3,
    height: 3,
    marginTop: 2,
  },
})
