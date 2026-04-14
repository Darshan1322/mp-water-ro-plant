const path = require('path')
const appJson = require('./app.json')

try {
  require('dotenv').config({ path: path.join(__dirname, '.env') })
} catch {
  /* optional during tooling */
}

const otpApiBaseUrl = String(process.env.EXPO_PUBLIC_OTP_API_BASE_URL || '')
  .trim()
  .replace(/\/$/, '')
const adminEmail = String(process.env.EXPO_PUBLIC_ADMIN_EMAIL || '')
  .trim()
  .toLowerCase()

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      otpApiBaseUrl,
      adminEmail,
    },
  },
}
