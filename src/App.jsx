import { useState } from 'react'
import './App.css'
import logoPng from './assets/logo.png'
import logoKnPng from './assets/logo-kn.png'
import videoCoin from './assets/videos/promo-coin-delivery.mp4'
import videoModern from './assets/videos/promo-modern.mp4'

const PHONE_DISPLAY = '95385 86907'
const PHONE_TEL = 'tel:+919538586907'
const WHATSAPP = 'https://wa.me/919538586907'
const INSTAGRAM = 'https://www.instagram.com/mp_water_supply?igsh=amV2MTNsOXgzMXpu'
const EMAIL = 'mpwatersupply.mandya@gmail.com'
const MAILTO = `mailto:${EMAIL}`
/** Google Maps (shared location) */
const MAPS_URL = 'https://share.google/JjCXtOMCgUJIdVyXg'

const VIDEO_ITEMS = [
  {
    src: videoCoin,
    titleKey: 'video1_title',
    descKey: 'video1_desc',
  },
  {
    src: videoModern,
    titleKey: 'video2_title',
    descKey: 'video2_desc',
  },
]

const I18N = {
  kn: {
    nav_home: 'ಮುಖಪುಟ',
    nav_plant: 'ಪ್ಲಾಂಟ್',
    nav_20l: '20L',
    nav_videos: 'ವೀಡಿಯೊಗಳು',
    nav_journey: 'ಪ್ರಕ್ರಿಯೆ',
    nav_mandya: 'ಮಂಡ್ಯ',
    nav_faq: 'ಪ್ರಶ್ನೆಗಳು',
    nav_order: 'ಆರ್ಡರ್',
    lang_kn: 'ಕನ್ನಡ',
    lang_en: 'English',
    lang_toggle_aria: 'ಭಾಷೆ ಬದಲಾಯಿಸಿ',
    menu_toggle_aria: 'ಮೆನು ತೆರೆಯಿರಿ',

    brand_name: 'ಎಂಪಿ ವಾಟರ್ RO ಪ್ಲಾಂಟ್',
    brand_tagline: 'ಶುದ್ಧ ನೀರು · ಉತ್ತಮ ಆರೋಗ್ಯ',

    hero_eyebrow: 'ಮಂಡ್ಯ · 20 ಲೀಟರ್ ಕೆನ್‌ಗಳು · RO ಪ್ಲಾಂಟ್',
    hero_soon: 'ಶೀಘ್ರದಲ್ಲಿ ಆರಂಭ',
    hero_h1_line1: 'ನಂಬಿಕೆಯಿಂದ',
    hero_h1_line2: 'ನಿಮ್ಮ ಮನೆಗೆ ನೀರು.',
    hero_tagline:
      'MP Water RO Plant ನಿಂದ ಸೀಲ್ಡ್ 20L ಶುದ್ಧ ನೀರಿನ ಕೆನ್‌ಗಳ ಸರಬರಾಜು ಮತ್ತು ಡೆಲಿವರಿ — ಮಂಡ್ಯ ನಗರ ಮತ್ತು ಸುತ್ತಮುತ್ತಲ ಗ್ರಾಮಗಳಿಗೆ.',
    hero_badge1: 'RO ಶುದ್ಧೀಕರಣ',
    hero_badge2: 'ಸೀಲ್ಡ್ 20L',
    hero_badge3: 'ಲೋಕಲ್ ರೂಟ್‌ಗಳು',
    hero_cta_order: 'ಆರ್ಡರ್ ಮಾಡಿ',
    hero_cta_whatsapp: 'WhatsApp',
    hero_cta_call: 'ಕಾಲ್',
    hero_slot_note: 'ಶೀಘ್ರದಲ್ಲೇ ಆರಂಭ — ಡೆಲಿವರಿ ಲಿಸ್ಟ್‌ಗೆ WhatsApp ಮಾಡಿ.',

    launch_ribbon: 'ಶೀಘ್ರ ಆರಂಭ — ಸಿದ್ಧತೆ ನಡೆಯುತ್ತಿದೆ',
    launch_chip1_label: 'ಗೋ-ಲೈವ್',
    launch_chip1_sub: 'ಗುರಿ ಸಮಯ',
    launch_chip2_label: 'RO ಪ್ಲಾಂಟ್',
    launch_chip2_sub: 'ಫೈನಲ್ ಚೆಕ್ಸ್',
    launch_chip3_label: '20L ರೂಟ್‌ಗಳು',
    launch_chip3_sub: 'ಮನೆ & ಅಂಗಡಿ',
    launch_text_prefix: 'ಮಂಡ್ಯ ನಗರ ಮತ್ತು ಸುತ್ತಮುತ್ತಲ ಗ್ರಾಮಗಳಿಗೆ ಸಂಪೂರ್ಣ ಡೆಲಿವರಿ ಆರಂಭ',
    launch_text_suffix:
      'ರಲ್ಲಿ. ಈಗಲೇ WhatsApp ನಲ್ಲಿ ಸಂದೇಶ ಮಾಡಿ — ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಉಳಿಸಿಕೊಳ್ಳಬಹುದು; ಆರಂಭವಾಗುತ್ತಿದ್ದಂತೆ ಸಮಯ ದೃಢಪಡಿಸುತ್ತೇವೆ.',

    quality_kicker: 'ಪ್ಲಾಂಟ್ ಗುಣಮಟ್ಟ',
    quality_title: 'ಮೂರು ಭರವಸೆ, ಒಂದು ಸರಬರಾಜು',
    quality_lead: 'ನಾವು ಮಾಡೋದು ಸರಳ: ಶುದ್ಧ ನೀರು + ಹೈಜಿನ್ + ಸಮಯಕ್ಕೆ ಡೆಲಿವರಿ.',

    product_kicker: 'ಉತ್ಪನ್ನ',
    product_title: 'ಒಂದೇ ಸೈಸ್. ಭರ್ಜರಿ ಪ್ರಮಾಣ.',
    product_lead:
      '20 ಲೀಟರ್ ಕೆನ್‌ಗಳು ಮನೆ, ಆಫೀಸ್, ಅಂಗಡಿ—all ಗೆ ಸೂಕ್ತ. ನಾವು ಅದನ್ನೇ ಉತ್ತಮವಾಗಿ ಮಾಡುತ್ತೇವೆ.',
    product_name: '20L ಶುದ್ಧ ನೀರಿನ ಕೆನ್',
    product_desc:
      'RO ಶುದ್ಧೀಕರಣ, ಹೈಜಿನಿಕ್ ಫಿಲ್ಲಿಂಗ್, ಸೀಲ್ಡ್ ಕೆನ್. ಮಂಡ್ಯ ಪ್ರದೇಶದ ಮನೆ/ಕ್ಲಿನಿಕ್/ಅಂಗಡಿಗಳಿಗೆ ಸೂಕ್ತ.',
    product_price_note: 'ಇಂದಿನ ದರ ಮತ್ತು ಕನಿಷ್ಠ ಆರ್ಡರ್‌ಗಾಗಿ ಕರೆ ಮಾಡಿ / WhatsApp ಮಾಡಿ.',
    product_cta_call: 'ಕರೆ ಮಾಡಿ',
    product_cta_form: 'ತಕ್ಷಣ ಆರ್ಡರ್ ಫಾರ್ಮ್',

    videos_kicker: 'ಪ್ರಿವ್ಯೂ',
    videos_title: 'ವೀಡಿಯೊ ಪ್ರಿವ್ಯೂ',
    videos_lead:
      'ಸೇವೆಯ ಒಂದು ಚಿಕ್ಕ ಪ್ರಿವ್ಯೂ: ಕಾಯಿನ್ ಬಾಕ್ಸ್ ನೀರು ಮತ್ತು 20L ಕೆನ್ ಡೆಲಿವರಿ — ಮನೆ, ಆಸ್ಪತ್ರೆ, ಮತ್ತು ಕಾಮರ್ಷಿಯಲ್ ಸ್ಥಳಗಳಿಗೆ.',
    video1_title: 'ಕಾಯಿನ್ ಬಾಕ್ಸ್ → ಶುದ್ಧ ನೀರು',
    video1_desc: 'ಕಾಯಿನ್ ಬಾಕ್ಸ್‌ನಿಂದ ನೀರು ಪಡೆಯುವ ಡೆಮೊ ಮತ್ತು ಶುದ್ಧ ನೀರಿನ ಔಟ್‌ಪುಟ್.',
    video2_title: 'ಪ್ಲಾಂಟ್ & ಡೆಲಿವರಿ',
    video2_desc: 'ಸೀಲ್ಡ್ ಕೆನ್‌ಗಳು, ಕ್ಲೀನ್ ಪ್ರಕ್ರಿಯೆ, ಮನೆ/ಆಸ್ಪತ್ರೆ/ವ್ಯಾಪಾರ ಸ್ಥಳಗಳಿಗೆ ಡೋರ್ ಡೆಲಿವರಿ.',

    journey_kicker: 'ಪ್ರಕ್ರಿಯೆ',
    journey_title: 'ಪ್ಲಾಂಟ್‌ನಿಂದ ನಿಮ್ಮ ಮನೆಗೆ',
    journey_lead: 'ನೀರಿನ ಕೆನ್ ನಿಮ್ಮ ಮನೆಗೆ ಬರುವ ಮೊದಲು ಏನು ನಡೆಯುತ್ತದೆ?',

    mandya_kicker: 'ಡೆಲಿವರಿ',
    mandya_title: 'ಮಂಡ್ಯ ನಗರ & ಗ್ರಾಮಗಳು',
    mandya_lead:
      'ನಿಮ್ಮ ಏರಿಯಾ ತಿಳಿಸಿ — ಇಂದು/ನಾಳೆ ರೂಟ್‌ನಲ್ಲಿ ಇದೆಯೇ ಎಂದು ತಿಳಿಸುತ್ತೇವೆ. ಲ್ಯಾಂಡ್ಮಾರ್ಕ್ ನೀಡಿದರೆ ಸಾಕು.',

    mandya_b1: '20L ಕೆನ್‌ಗಳು ಮಾತ್ರ — ಒಂದೇ ಉತ್ಪನ್ನ, ಉತ್ತಮ ಗುಣಮಟ್ಟ',
    mandya_b2: 'ಗ್ರಾಮಗಳಿಗೆ ಲ್ಯಾಂಡ್ಮಾರ್ಕ್ ಆಧಾರಿತ ವಿಳಾಸ',
    mandya_b3: 'WhatsApp ಮೂಲಕ ಸಮಯ ಬದಲಾವಣೆ ಸುಲಭ',
    mandya_b4: 'ಲೋಡಿಂಗ್ ತಂಡಕ್ಕೆ ನೇರ ಸಂಪರ್ಕ',

    location_title: 'ಪ್ಲಾಂಟ್ ಲೊಕೇಶನ್',
    location_line_prefix: 'ಇಲ್ಲಿ ತೆರಳಿ/ಡ್ರೈವರ್‌ಗೆ ಕಳುಹಿಸಿ — ',
    location_cta: 'ಮ್ಯಾಪ್ & ದಿಕ್ಕು ತೆರೆಯಿರಿ',
    location_pin_title: 'ಲ್ಯಾಂಡ್ಮಾರ್ಕ್ ಮೂಲಕ ಹೇಳಿ',
    location_pin_text:
      'ಮಂಡಲ/ಗ್ರಾಮ ಹೆಸರು, ಶಾಲೆ ಅಥವಾ ದೇವಸ್ಥಾನ ಹತ್ತಿರ — ಡ್ರೈವರ್‌ಗೂ ಸುಲಭವಾಗಿ ಸಿಗುವಂತೆ ಹೇಳಿ.',
    location_reach_title: 'ಸಂಪರ್ಕಿಸಿ',
    location_whatsapp: 'WhatsApp ತೆರೆಯಿರಿ',
    location_instagram: 'Instagram @mp_water_supply',

    uses_kicker: '20L ಬಳಕೆ',
    uses_title: 'ಮಂಡ್ಯದಲ್ಲಿನ ಬಳಕೆಗಳು',
    uses_lead: 'ಒಂದೇ ಉತ್ಪನ್ನ — ನಿಮ್ಮ ಅಗತ್ಯಕ್ಕೆ ಹೊಂದುವ ಟೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ.',
    about_strip:
      'MP Water RO Plant — Purified Water Supply — Pure Health. ಮಂಡ್ಯ ಪ್ರದೇಶಕ್ಕೆ ನೇರ ಡೆಲಿವರಿ: ಕರೆ ಮಾಡಿ, ಮೆಸೇಜ್ ಮಾಡಿ, ಸ್ಪಷ್ಟ ಉತ್ತರ ಪಡೆಯಿರಿ.',

    faq_kicker: 'ಸ್ಪಷ್ಟ ಉತ್ತರಗಳು',
    faq_title: 'ಪ್ರಶ್ನೆಗಳು',
    faq_lead: 'ಪ್ರಶ್ನೆ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ — ಸರಳ ಉತ್ತರ.',

    contact_success_prefix: 'WhatsApp ತೆರೆದುಕೊಳ್ಳದಿದ್ದರೆ ಕರೆ ಮಾಡಿ ',
    contact_success_mid: ' ಅಥವಾ ಇಮೇಲ್ ಮಾಡಿ ',
    voice_note: 'ವಾಯ್ಸ್ ಆರ್ಡರ್ ಸಹ ಸ್ವಾಗತ — ಮೊದಲ ಬಾರಿ ಲ್ಯಾಂಡ್ಮಾರ್ಕ್‌ಗೆ ವಿಶೇಷವಾಗಿ.',
    side_phone: 'ಫೋನ್',
    side_whatsapp: 'WhatsApp',
    side_instagram: 'Instagram',
    side_email: 'ಇಮೇಲ್',
    side_location: 'ಲೊಕೇಶನ್',
    side_maps: 'Google Maps — ದಿಕ್ಕು',

    footer_jump: 'ಲಿಂಕ್‌ಗಳು',
    footer_contact: 'ಸಂಪರ್ಕ',
    footer_follow: 'ಫಾಲೋ',
    footer_tagline: 'ಶುದ್ಧ ನೀರು · ಉತ್ತಮ ಆರೋಗ್ಯ',
    footer_area: '20L ಕೆನ್‌ಗಳು · ಮಂಡ್ಯ ನಗರ & ಗ್ರಾಮಗಳು',
    footer_rights: 'ಎಲ್ಲ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',

    contact_kicker: 'ಆರ್ಡರ್',
    contact_title: 'WhatsApp ಮೂಲಕ ಆರ್ಡರ್ ಮಾಡಿ',
    contact_lead_prefix: 'ಫಾರ್ಮ್ ತುಂಬಿ — WhatsApp ತೆರೆಯುತ್ತದೆ. ಬೇಕಾದರೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಇಮೇಲ್ ಮಾಡಿ ',
    name_label: 'ನಿಮ್ಮ ಹೆಸರು',
    phone_label: 'ಮೊಬೈಲ್ ನಂಬರ್',
    qty_label: '20L ಕೆನ್‌ಗಳು (1 ರಿಂದ 500)',
    area_label: 'ಏರಿಯಾ / ಗ್ರಾಮ / ಲ್ಯಾಂಡ್ಮಾರ್ಕ್',
    note_label: 'ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)',
    note_placeholder: 'ಸಮಯ, ಗೇಟ್, ಫ್ಲೋರ್…',
    submit_btn: 'WhatsApp ಮೆಸೇಜ್ ತಯಾರಿಸಿ',

    quality_tag1: 'ಶುದ್ಧೀಕರಣ',
    quality_title1: 'RO ಶುದ್ಧೀಕರಣ',
    quality_text1: 'ಬಹು ಹಂತದ RO ಶುದ್ಧೀಕರಣದಿಂದ ಕುಡಿಯುವ ನೀರಿಗೆ ಸ್ಪಷ್ಟತೆ ಮತ್ತು ನಂಬಿಕೆ.',
    quality_tag2: 'ಹೈಜಿನ್',
    quality_title2: 'ಹೈಜಿನಿಕ್ ಫಿಲ್ಲಿಂಗ್',
    quality_text2: '20L ಕೆನ್‌ಗಳು ಸೀಲ್ಡ್ ಆಗಿ, ಸ್ವಚ್ಚತಾ ಕ್ರಮ ಪಾಲಿಸಿ ಭರ್ತಿ ಮಾಡಲಾಗುತ್ತದೆ.',
    quality_tag3: 'ಲೋಕಲ್',
    quality_title3: 'ಮಂಡ್ಯಕ್ಕೆ ಸಮೀಪ',
    quality_text3: 'ಲೋಕಲ್ ಸರಬರಾಜು ಆದ್ದರಿಂದ ಸಮಯಕ್ಕೆ ಡೆಲಿವರಿ ಮತ್ತು ಫ್ರೆಶ್ ಸ್ಟಾಕ್.',

    journey_step1_title: 'RO ಶುದ್ಧೀಕರಣ',
    journey_step1_text: 'ನೀರು ಪ್ಲಾಂಟ್ ಪ್ರಕ್ರಿಯೆ ದಾಟಿ ನಂತರ ಮಾತ್ರ ಕೆನ್‌ಗೆ ಬರುತ್ತದೆ.',
    journey_step2_title: 'ಕೆನ್ ಸ್ವಚ್ಚತೆ & ಫಿಲ್ಲಿಂಗ್',
    journey_step2_text: 'ಹೈಜಿನ್‌ ಮೇಲೆ ಗಮನ ನೀಡಿ ನಿಯಮಿತ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ 20L ಕೆನ್‌ಗಳನ್ನು ಭರ್ತಿ ಮಾಡುತ್ತೇವೆ.',
    journey_step3_title: 'ಸೀಲ್ಡ್ & ಲೇಬಲ್',
    journey_step3_text: 'ಸೀಲ್ಡ್ ಮಾಡಿ, ಲೇಬಲ್‌ನೊಂದಿಗೆ ಡೆಲಿವರಿಗೆ ತಯಾರಾಗುತ್ತದೆ.',
    journey_step4_title: 'ಡೆಲಿವರಿ ರೂಟ್',
    journey_step4_text: 'ಮಂಡ್ಯ ನಗರ ಮತ್ತು ಗ್ರಾಮಗಳಿಗೆ ರೂಟ್ ಪ್ಲ್ಯಾನ್ ಮಾಡಿ ನಿಮ್ಮ ಮನೆಗೆ ತಲುಪಿಸುತ್ತದೆ.',

    bento1_title: 'ಮನೆಗಳು & ಅಡುಗೆ',
    bento1_text: 'ದಿನನಿತ್ಯ ಕುಡಿಯಲು ಮತ್ತು ಅಡುಗೆಗೆ 20L ಕೆನ್ ಅನುಕೂಲ.',
    bento2_title: 'ಅಂಗಡಿಗಳು',
    bento2_text: 'ಚಿಕ್ಕ ಅಂಗಡಿಗಳು/ಹೋಟೆಲ್‌ಗಳಿಗೆ ನಿಯಮಿತ ಸರಬರಾಜು.',
    bento3_title: 'ಕಾರ್ಯಕ್ರಮಗಳು',
    bento3_text: 'ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ಹೆಚ್ಚುವರಿ ಕೆನ್‌ಗಳು ಬೇಕಾದರೆ ಮುಂಚಿತವಾಗಿ ತಿಳಿಸಿ.',
    bento4_title: 'ಮಂಡ್ಯ ಮೊದಲಿಗೆ',
    bento4_text: 'ಮಂಡ್ಯ ನಗರ ಮತ್ತು ಸುತ್ತಮುತ್ತಲ ಗ್ರಾಮಗಳ ಡೆಲಿವರಿ ಮೇಲೆ ಫೋಕಸ್.',

    faq_q1: 'ಯಾವ ಸೈಸ್ ಕೆನ್‌ಗಳನ್ನು ಡೆಲಿವರಿ ಮಾಡುತ್ತೀರಿ?',
    faq_a1: 'ನಾವು 20 ಲೀಟರ್ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಕೆನ್‌ಗಳನ್ನು ಡೆಲಿವರಿ ಮಾಡುತ್ತೇವೆ.',
    faq_q2: 'ಯಾವ ಪ್ರದೇಶಗಳಿಗೆ ಡೆಲಿವರಿ?',
    faq_a2: 'ಮಂಡ್ಯ ನಗರ ಮತ್ತು ಸುತ್ತಮುತ್ತಲ ಗ್ರಾಮಗಳು. ನಿಮ್ಮ ಲ್ಯಾಂಡ್ಮಾರ್ಕ್ ಕೊಟ್ಟರೆ ರೂಟ್ ಹಾಗೂ ಸಮಯ ತಿಳಿಸುತ್ತೇವೆ.',
    faq_q3: 'ಆರ್ಡರ್ ಹೇಗೆ ಮಾಡುವುದು?',
    faq_a3: 'ಕೆಳಗಿನ ಫಾರ್ಮ್ ಮೂಲಕ WhatsApp ತೆರೆಯುತ್ತದೆ. ಇಲ್ಲವೇ ಕರೆ ಮಾಡಿ ಅಥವಾ ಇಮೇಲ್ ಮಾಡಿ.',
    faq_q4: 'ದರ ಹೇಗೆ ಗೊತ್ತಾಗುತ್ತದೆ?',
    faq_a4: 'ದರವು ದೂರ/ರೂಟ್ ಮೇಲೆ ಬದಲಾಗಬಹುದು. ಇಂದಿನ ದರಕ್ಕಾಗಿ ಕರೆ ಮಾಡಿ ಅಥವಾ WhatsApp ಮಾಡಿ.',
    faq_q5: 'RO ಪ್ಲಾಂಟ್ ಲೊಕೇಶನ್ ಎಲ್ಲಿ?',
    faq_a5: 'Google Maps ನಲ್ಲಿ ನಮ್ಮ ಲೊಕೇಶನ್ ತೆರೆಯಿರಿ — ದಿಕ್ಕು ತಿಳಿಯಲು.',
  },
  en: {
    nav_home: 'Home',
    nav_plant: 'Plant',
    nav_20l: '20L',
    nav_videos: 'Videos',
    nav_journey: 'Journey',
    nav_mandya: 'Mandya',
    nav_faq: 'FAQ',
    nav_order: 'Order',
    lang_kn: 'ಕನ್ನಡ',
    lang_en: 'English',
    lang_toggle_aria: 'Toggle language',
    menu_toggle_aria: 'Toggle menu',

    brand_name: 'MP WATER RO PLANT',
    brand_tagline: 'Purified water supply · Pure health',

    hero_eyebrow: 'Mandya · 20 litre cans · RO plant',
    hero_soon: 'Starting soon',
    hero_h1_line1: 'Water that carries',
    hero_h1_line2: 'your trust home.',
    hero_tagline:
      'MP Water RO Plant fills and delivers sealed 20L purified cans across Mandya city and surrounding villages.',
    hero_badge1: 'RO purified',
    hero_badge2: 'Sealed 20L',
    hero_badge3: 'Local routes',
    hero_cta_order: 'Order cans',
    hero_cta_whatsapp: 'WhatsApp',
    hero_cta_call: 'Call',
    hero_slot_note: 'Opening soon — WhatsApp us to get on the delivery list.',

    launch_ribbon: "Opening soon — we're starting up",
    launch_chip1_label: 'Target go-live',
    launch_chip1_sub: 'Timeline',
    launch_chip2_label: 'RO plant',
    launch_chip2_sub: 'Final checks',
    launch_chip3_label: '20L routes',
    launch_chip3_sub: 'Homes & shops',
    launch_text_prefix: 'Full delivery across Mandya city and nearby villages begins in',
    launch_text_suffix:
      ". You can still message us on WhatsApp to save your place — we'll confirm slots as we open.",

    quality_kicker: 'Inside the plant logic',
    quality_title: 'Three anchors, one pour',
    quality_lead: 'Purity, hygiene, and local delivery — kept simple.',

    product_kicker: 'Our product',
    product_title: 'One size. Serious volume.',
    product_lead:
      'Twenty litres is the sweet spot for dispensers, busy kitchens, and small commercial counters.',
    product_name: '20L drinking water can',
    product_desc:
      'RO-treated water, hygienic fill, sealed container. Ideal for Mandya homes, clinics, and shops.',
    product_price_note: "Ask for today's rate and minimum order.",
    product_cta_call: 'Call',
    product_cta_form: 'Quick order form',

    videos_kicker: 'Preview',
    videos_title: 'Quick preview videos',
    videos_lead:
      'Two short previews: coin box water and 20L can delivery use cases for homes, hospitals, and commercial places around Mandya.',
    video1_title: 'Coin box → clean water',
    video1_desc: 'A short demo showing coin box water dispensing and clean drinking water output.',
    video2_title: 'Modern plant & delivery',
    video2_desc: 'Sealed cans, a clean process, and doorstep delivery for homes, hospitals, and commercial places.',

    journey_kicker: 'Transparency, staged',
    journey_title: 'From membrane to your matka',
    journey_lead: 'A simple four-step path — so you know what happens before the can reaches your doorstep.',

    mandya_kicker: 'Hyper-local routing',
    mandya_title: 'Mandya city & villages',
    mandya_lead:
      "Tell us your area and landmark — we’ll confirm coverage and today’s route timing.",

    mandya_b1: '20L cans only — focused quality',
    mandya_b2: 'Landmark-friendly addressing for villages',
    mandya_b3: 'WhatsApp-friendly rescheduling',
    mandya_b4: 'Direct line to the team that loads the vehicle',

    location_title: 'Plant location',
    location_line_prefix: 'Visit or send drivers here — opens in ',
    location_cta: 'Open map & directions',
    location_pin_title: 'Drop a pin in words',
    location_pin_text:
      'Mention mandal, village name, school or temple nearby — whatever helps our driver find you on the first try.',
    location_reach_title: 'Reach us',
    location_whatsapp: 'Open WhatsApp',
    location_instagram: 'Instagram @mp_water_supply',

    uses_kicker: 'Where 20L fits',
    uses_title: 'A bento of real Mandya use cases',
    uses_lead: 'Mixed tiles, one product — pick the story that sounds like yours.',
    about_strip:
      'MP Water RO Plant — Purified Water Supply — Pure Health. A Mandya-area RO plant with delivery that stays human: call, message, get a straight answer.',

    faq_kicker: 'Straight answers',
    faq_title: 'FAQ',
    faq_lead: 'Tap a question — no carousel, no fluff.',

    contact_success_prefix: 'If WhatsApp did not open, dial ',
    contact_success_mid: ' or email ',
    voice_note: 'Voice orders welcome — especially for first-time delivery pins.',
    side_phone: 'Phone',
    side_whatsapp: 'WhatsApp',
    side_instagram: 'Instagram',
    side_email: 'Email',
    side_location: 'Location',
    side_maps: 'Google Maps — directions',

    footer_jump: 'Jump',
    footer_contact: 'Contact',
    footer_follow: 'Follow',
    footer_tagline: 'Purified water supply · Pure health',
    footer_area: '20L cans · Mandya city & villages',
    footer_rights: 'All rights reserved.',

    contact_kicker: 'Order desk',
    contact_title: 'Send a WhatsApp order in seconds',
    contact_lead_prefix:
      'Fill the form and WhatsApp opens. You can also call us or email ',
    name_label: 'Your name',
    phone_label: 'Mobile number',
    qty_label: '20L cans (1 to 500)',
    area_label: 'Area / village / landmark',
    note_label: 'Notes (optional)',
    note_placeholder: 'Time window, floor, gate…',
    submit_btn: 'Compose WhatsApp order',

    /* Quality cards */
    quality_tag1: 'Filtration',
    quality_title1: 'RO purification',
    quality_text1: 'Multi-stage reverse osmosis tuned for drinking water — clearer taste and more confidence in every can.',
    quality_tag2: 'Hygiene',
    quality_title2: 'Hygienic filling',
    quality_text2: 'Sealed 20L cans and careful handling at the plant — cleanliness first, no shortcuts.',
    quality_tag3: 'Local',
    quality_title3: 'Local supply',
    quality_text3: 'Packed near Mandya so routes stay short and supply stays dependable.',

    /* Journey steps */
    journey_step1_title: 'RO treatment',
    journey_step1_text: 'Water passes through our plant process before it ever touches your can.',
    journey_step2_title: 'Sanitised fill',
    journey_step2_text: '20 litre containers are filled in a controlled, hygiene-first workflow.',
    journey_step3_title: 'Sealed & labelled',
    journey_step3_text: 'Sealed and ready for transport with MP Water RO Plant identity.',
    journey_step4_title: 'Route to you',
    journey_step4_text: 'We schedule drops across Mandya city and nearby villages — call or WhatsApp.',

    /* Bento tiles */
    bento1_title: 'Homes & kitchens',
    bento1_text: 'Daily drinking and cooking — 20L fits the week comfortably.',
    bento2_title: 'Shops',
    bento2_text: 'Retail counters and small eateries that need steady refills.',
    bento3_title: 'Functions',
    bento3_text: 'Extra cans for events — tell us the date and count early.',
    bento4_title: 'Mandya-first',
    bento4_text: 'City lanes and surrounding villages on our delivery map.',

    /* FAQ */
    faq_q1: 'What size cans do you deliver?',
    faq_a1: 'We deliver 20 litre purified drinking water cans.',
    faq_q2: 'Which areas do you cover?',
    faq_a2: 'Mandya city and nearby villages. Share your landmark and we will confirm coverage and timing.',
    faq_q3: 'How do I place an order?',
    faq_a3: 'Use the form to open WhatsApp with your details, or call us / email us.',
    faq_q4: 'How do I know the rate?',
    faq_a4: 'Rates can change with supply and distance. Call or message for today’s price and minimum quantity.',
    faq_q5: 'Where is the RO plant?',
    faq_a5: 'Open our location on Google Maps for directions.',
  },
}

function getText(lang, key) {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key
}

function buildNav(lang) {
  return [
    { href: '#home', label: getText(lang, 'nav_home') },
    { href: '#quality', label: getText(lang, 'nav_plant') },
    { href: '#product', label: getText(lang, 'nav_20l') },
    { href: '#videos', label: getText(lang, 'nav_videos') },
    { href: '#journey', label: getText(lang, 'nav_journey') },
    { href: '#mandya', label: getText(lang, 'nav_mandya') },
    { href: '#faq', label: getText(lang, 'nav_faq') },
    { href: '#contact', label: getText(lang, 'nav_order') },
  ]
}

const qualityPoints = [
  {
    tagKey: 'quality_tag1',
    titleKey: 'quality_title1',
    textKey: 'quality_text1',
  },
  {
    tagKey: 'quality_tag2',
    titleKey: 'quality_title2',
    textKey: 'quality_text2',
  },
  {
    tagKey: 'quality_tag3',
    titleKey: 'quality_title3',
    textKey: 'quality_text3',
  },
]

const journeySteps = [
  { step: '1', titleKey: 'journey_step1_title', textKey: 'journey_step1_text' },
  { step: '2', titleKey: 'journey_step2_title', textKey: 'journey_step2_text' },
  { step: '3', titleKey: 'journey_step3_title', textKey: 'journey_step3_text' },
  { step: '4', titleKey: 'journey_step4_title', textKey: 'journey_step4_text' },
]

const bentoCells = [
  { wide: true, icon: '🏠', titleKey: 'bento1_title', textKey: 'bento1_text' },
  { wide: false, icon: '🏪', titleKey: 'bento2_title', textKey: 'bento2_text' },
  { wide: false, icon: '🎉', titleKey: 'bento3_title', textKey: 'bento3_text' },
  { wide: true, icon: '📍', titleKey: 'bento4_title', textKey: 'bento4_text' },
]

const faqItems = [
  { qKey: 'faq_q1', aKey: 'faq_a1' },
  { qKey: 'faq_q2', aKey: 'faq_a2' },
  { qKey: 'faq_q3', aKey: 'faq_a3' },
  { qKey: 'faq_q4', aKey: 'faq_a4' },
  { qKey: 'faq_q5', aKey: 'faq_a5', kind: 'maps' },
]

/** Change to empty string when you are fully live */
const LAUNCH_WINDOW_LABELS = {
  kn: '1 ವಾರ',
  en: 'about 1 week',
}

function getLaunchWindowLabel(lang) {
  return LAUNCH_WINDOW_LABELS[lang] || LAUNCH_WINDOW_LABELS.en
}

function LaunchSoonBanner({ lang }) {
  const t = (key) => getText(lang, key)
  const launchWindowLabel = getLaunchWindowLabel(lang)
  return (
    <div className="launch-soon" role="status" aria-live="polite">
      <div className="launch-soon__inner">
        <p className="launch-soon__ribbon">
          <span className="launch-soon__rocket" aria-hidden>
            🚀
          </span>
          {t('launch_ribbon')}
        </p>

        <div className="launch-soon__icons">
          <div className="launch-soon__chip">
            <div className="launch-soon__chip-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
                <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <strong>{launchWindowLabel}</strong>
            <span>{t('launch_chip1_label')}</span>
          </div>
          <div className="launch-soon__chip">
            <div className="launch-soon__chip-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M12 3c-4 6-7 8-7 12a7 7 0 0014 0c0-4-3-6-7-12z" />
              </svg>
            </div>
            <strong>{t('launch_chip2_label')}</strong>
            <span>{t('launch_chip2_sub')}</span>
          </div>
          <div className="launch-soon__chip">
            <div className="launch-soon__chip-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M3 11h12v8H3v-8zM15 11h3l3 3v5h-3" />
                <circle cx="7.5" cy="19" r="1.75" fill="currentColor" stroke="none" />
                <circle cx="18" cy="19" r="1.75" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <strong>{t('launch_chip3_label')}</strong>
            <span>{t('launch_chip3_sub')}</span>
          </div>
        </div>

        <p className="launch-soon__text">
          {t('launch_text_prefix')} <strong>{launchWindowLabel}</strong>
          {t('launch_text_suffix')}
        </p>
      </div>
    </div>
  )
}

function WaveDivider({ flip, toNavy }) {
  return (
    <div
      className={[
        'wave-wrap',
        flip && 'wave-wrap--flip',
        toNavy && 'wave-wrap--to-navy',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none">
        <path
          fill="currentColor"
          d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z"
        />
      </svg>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formStatus, setFormStatus] = useState(null)
  const [openFaq, setOpenFaq] = useState(-1)
  const [lang, setLang] = useState('kn')

  const closeMenu = () => setMenuOpen(false)
  const t = (key) => getText(lang, key)
  const nav = buildNav(lang)
  const activeLogo = lang === 'kn' ? logoKnPng : logoPng

  const shouldShowLangToggle = true

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.name.value.trim()
    const phone = form.phone.value.trim()
    const qty = form.quantity.value
    const area = form.area.value.trim()
    const note = form.note.value.trim()

    const text = [
      'Hello MP Water RO Plant,',
      '',
      'I would like to order 20L purified water cans.',
      `Name: ${name}`,
      `My phone: ${phone}`,
      `Number of cans: ${qty}`,
      `Delivery area: ${area}`,
      note ? `Notes: ${note}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    window.open(`${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setFormStatus('opened')
    form.reset()
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#home" className="brand" onClick={closeMenu}>
            <img
              src={activeLogo}
              alt={lang === 'kn' ? 'ಎಂಪಿ ವಾಟರ್ RO ಪ್ಲಾಂಟ್ ಲೋಗೋ' : 'MP Water RO Plant logo'}
              width="96"
              height="96"
            />
            <div className="brand-text">
              <strong>{t('brand_name')}</strong>
              <span>{t('brand_tagline')}</span>
            </div>
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label={t('menu_toggle_aria')}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`nav${menuOpen ? ' is-open' : ''}`} aria-label="Main">
            {nav.map(({ href, label }) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label}
              </a>
            ))}
            {shouldShowLangToggle && (
              <button
                type="button"
                className="lang-toggle"
                onClick={() => setLang((l) => (l === 'kn' ? 'en' : 'kn'))}
                aria-label={t('lang_toggle_aria')}
              >
                {lang === 'kn' ? t('lang_en') : t('lang_kn')}
              </button>
            )}
            <a className="nav-cta" href={PHONE_TEL} onClick={closeMenu}>
              {PHONE_DISPLAY}
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__mesh" aria-hidden />
          <LaunchSoonBanner lang={lang} />
          <div className="hero__grid">
            <div className="hero__copy">
              <p className="hero__eyebrow">
                {t('hero_eyebrow')} · <span className="hero__eyebrow-soon">{t('hero_soon')}</span>
              </p>
              <h1>
                {t('hero_h1_line1')}
                <br />
                <em>{t('hero_h1_line2')}</em>
              </h1>
              <p className="hero__tagline">
                {t('hero_tagline')}
              </p>
              <div className="hero__badges">
                <span className="hero-badge">{t('hero_badge1')}</span>
                <span className="hero-badge">{t('hero_badge2')}</span>
                <span className="hero-badge">{t('hero_badge3')}</span>
              </div>
              <div className="hero__actions">
                <a className="btn btn--primary" href="#contact">
                  {t('hero_cta_order')}
                </a>
                <a className="btn btn--light" href={WHATSAPP} target="_blank" rel="noreferrer">
                  {t('hero_cta_whatsapp')}
                </a>
                <a className="btn btn--light" href={PHONE_TEL}>
                  {t('hero_cta_call')}
                </a>
              </div>
            </div>
            <div className="hero__visual">
              <div className="hero__visual-stack">
                <div className="hero__logo-frame">
                  <div className="hero__logo-inner">
                    <img src={activeLogo} alt="" width="360" height="280" />
                  </div>
                </div>
                <a className="hero__slot-note" href={WHATSAPP} target="_blank" rel="noreferrer">
                  {t('hero_slot_note')}
                </a>
              </div>
            </div>
          </div>
        </section>

        <WaveDivider />
        <div style={{ background: 'var(--mist)', marginTop: '-1px' }}>
          <section className="section section--mist" id="quality" style={{ paddingTop: 48 }}>
            <div className="section__inner">
              <p className="section-kicker">{t('quality_kicker')}</p>
              <h2 className="section-title">{t('quality_title')}</h2>
              <p className="section-lead">{t('quality_lead')}</p>
              <div className="quality-deck">
                {qualityPoints.map((item) => (
                  <article key={item.titleKey} className="quality-card">
                    <span className="tag">{t(item.tagKey)}</span>
                    <h3>{t(item.titleKey)}</h3>
                    <p>{t(item.textKey)}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="section" id="product">
          <div className="section__inner">
            <p className="section-kicker">{t('product_kicker')}</p>
            <h2 className="section-title">{t('product_title')}</h2>
            <p className="section-lead">{t('product_lead')}</p>
            <div className="product-spotlight">
              <div className="product-mega" aria-hidden>
                20<span>litre</span>
              </div>
              <div>
                <h3>{t('product_name')}</h3>
                <p>{t('product_desc')}</p>
                <p className="price-note">{t('product_price_note')}</p>
                <div className="hero__actions" style={{ marginTop: '22px' }}>
                  <a className="btn btn--primary" href={PHONE_TEL}>
                    {t('product_cta_call')} {PHONE_DISPLAY}
                  </a>
                  <a className="btn btn--outline" href="#contact">
                    {t('product_cta_form')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--videos" id="videos">
          <div className="section__inner">
            <p className="section-kicker">{t('videos_kicker')}</p>
            <h2 className="section-title">{t('videos_title')}</h2>
            <p className="section-lead">{t('videos_lead')}</p>

            <div className="video-grid">
              {VIDEO_ITEMS.map((v) => (
                <article key={v.src} className="video-card">
                  <div className="video-card__media">
                    <video controls playsInline preload="metadata">
                      <source src={v.src} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="video-card__meta">
                    <h3>{t(v.titleKey)}</h3>
                    <p>{t(v.descKey)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--dark" id="journey">
          <div className="section__inner">
            <p className="section-kicker">{t('journey_kicker')}</p>
            <h2 className="section-title">{t('journey_title')}</h2>
            <p className="section-lead" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {t('journey_lead')}
            </p>
            <div className="timeline">
              {journeySteps.map((s) => (
                <div key={s.step} className="timeline-step" data-step={s.step}>
                  <strong>{t(s.titleKey)}</strong>
                  <p>{t(s.textKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WaveDivider flip toNavy />

        <section className="section delivery" id="mandya">
          <div className="section__inner">
            <p className="section-kicker">{t('mandya_kicker')}</p>
            <h2 className="section-title">{t('mandya_title')}</h2>
            <div className="delivery__grid">
              <div>
                <p className="section-lead">
                  {t('mandya_lead')}
                </p>
                <ul className="pulse-list">
                  <li>{t('mandya_b1')}</li>
                  <li>{t('mandya_b2')}</li>
                  <li>{t('mandya_b3')}</li>
                  <li>{t('mandya_b4')}</li>
                </ul>
              </div>
              <div className="area-box" id="location">
                <h4>{t('location_title')}</h4>
                <p style={{ marginBottom: '14px' }}>
                  {t('location_line_prefix')}
                  <a className="maps-link" href={MAPS_URL} target="_blank" rel="noreferrer">
                    Google Maps
                  </a>
                  .
                </p>
                <a className="maps-cta" href={MAPS_URL} target="_blank" rel="noreferrer">
                  {t('location_cta')}
                </a>
                <h4 style={{ marginTop: '22px' }}>{t('location_pin_title')}</h4>
                <p style={{ marginBottom: '16px' }}>
                  {t('location_pin_text')}
                </p>
                <h4>{t('location_reach_title')}</h4>
                <p>
                  <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
                  <br />
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">
                    {t('location_whatsapp')}
                  </a>
                  <br />
                  <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                    {t('location_instagram')}
                  </a>
                  <br />
                  <a href={MAILTO}>{EMAIL}</a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--bento-bg" id="uses">
          <div className="section__inner">
            <p className="section-kicker">{t('uses_kicker')}</p>
            <h2 className="section-title">{t('uses_title')}</h2>
            <p className="section-lead">{t('uses_lead')}</p>
            <div className="bento">
              {bentoCells.map((cell) => (
                <div key={cell.titleKey} className={`bento__cell${cell.wide ? ' bento__cell--wide' : ''}`}>
                  <div className="bento__icon">{cell.icon}</div>
                  <h4>{t(cell.titleKey)}</h4>
                  <p>{t(cell.textKey)}</p>
                </div>
              ))}
            </div>
            <div className="about-strip">
              {t('about_strip')}
            </div>
          </div>
        </section>

        <section className="section section--mist" id="faq">
          <div className="section__inner">
            <p className="section-kicker">{t('faq_kicker')}</p>
            <h2 className="section-title">{t('faq_title')}</h2>
            <p className="section-lead">{t('faq_lead')}</p>
            <div className="faq-list">
              {faqItems.map((item, i) => (
                <div key={item.qKey} className={`faq-item${openFaq === i ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  >
                    <span>{t(item.qKey)}</span>
                    <span aria-hidden>+</span>
                  </button>
                  <div className="faq-a">
                    {item.kind === 'maps' ? (
                      <>
                        {t(item.aKey)}{' '}
                        <a className="faq-inline-link" href={MAPS_URL} target="_blank" rel="noreferrer">
                          Google Maps
                        </a>
                        .
                      </>
                    ) : (
                      t(item.aKey)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="contact" style={{ paddingBottom: 100 }}>
          <div className="section__inner">
            <p className="section-kicker">{t('contact_kicker')}</p>
            <h2 className="section-title">{t('contact_title')}</h2>
            <p className="section-lead contact-intro">
              {t('contact_lead_prefix')}
              <a href={MAILTO}>{EMAIL}</a>.
            </p>
            <div className="contact-grid">
              <form className="contact-form" onSubmit={handleSubmit}>
                <label htmlFor="name">{t('name_label')}</label>
                <input id="name" name="name" type="text" required autoComplete="name" />

                <label htmlFor="phone">{t('phone_label')}</label>
                <input id="phone" name="phone" type="tel" required autoComplete="tel" />

                <label htmlFor="quantity">{t('qty_label')}</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max="500"
                  defaultValue="2"
                  required
                  inputMode="numeric"
                />

                <label htmlFor="area">{t('area_label')}</label>
                <input id="area" name="area" type="text" required placeholder="Mandya — …" />

                <label htmlFor="note">{t('note_label')}</label>
                <textarea id="note" name="note" placeholder={t('note_placeholder')} />

                <button type="submit" className="btn btn--primary">
                  {t('submit_btn')}
                </button>
                {formStatus === 'opened' && (
                  <p className="form-success">
                    {t('contact_success_prefix')}
                    <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
                    {t('contact_success_mid')}
                    <a href={MAILTO}>{EMAIL}</a>.
                  </p>
                )}
              </form>
              <div className="contact-side">
                <p style={{ margin: 0, fontSize: '1.12rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.92)' }}>
                  {t('voice_note')}
                </p>
                <h4>{t('side_phone')}</h4>
                <p>
                  <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
                </p>
                <h4>{t('side_whatsapp')}</h4>
                <p>
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </p>
                <h4>{t('side_instagram')}</h4>
                <p>
                  <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                    @mp_water_supply
                  </a>
                </p>
                <h4>{t('side_email')}</h4>
                <p className="contact-email">
                  <a href={MAILTO}>{EMAIL}</a>
                </p>
                <h4>{t('side_location')}</h4>
                <p>
                  <a className="maps-link maps-link--on-dark" href={MAPS_URL} target="_blank" rel="noreferrer">
                    {t('side_maps')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <a
        className="fab"
        href={WHATSAPP}
        target="_blank"
        rel="noreferrer"
        aria-label={lang === 'kn' ? 'WhatsApp ಚಾಟ್' : 'Chat on WhatsApp'}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <strong>MP WATER RO PLANT</strong>
            {t('footer_tagline')}
            <br />
            {t('footer_area')}
          </div>
          <div>
            <strong>{t('footer_jump')}</strong>
            <a href="#product">20L</a>
            {' · '}
            <a href="#journey">{t('nav_journey')}</a>
            {' · '}
            <a href="#faq">{t('nav_faq')}</a>
            {' · '}
            <a href="#contact">{t('nav_order')}</a>
          </div>
          <div>
            <strong>{t('footer_contact')}</strong>
            <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
            <br />
            <a href={MAILTO}>{EMAIL}</a>
          </div>
          <div className="footer-social">
            <strong>{t('footer_follow')}</strong>
            <a
              className="footer-social__ig"
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              aria-label="MP Water on Instagram"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
              </svg>
              @mp_water_supply
            </a>
          </div>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} MP Water RO Plant. {t('footer_rights')}
        </p>
      </footer>
    </div>
  )
}

export default App
