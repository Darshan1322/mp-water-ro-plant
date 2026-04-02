import { useState } from 'react'
import './App.css'
import logoPng from './assets/logo.png'

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
    src: 'videos/promo-coin-delivery.mp4',
    title: '₹5 coin → clean water',
    desc: 'Coin box demo + instant water pour — a simple, memorable proof of service.',
  },
  {
    src: 'videos/promo-modern.mp4',
    title: 'Modern plant & delivery',
    desc: 'Clean look, sealed cans, and doorstep delivery for homes, hospitals, and commercial places.',
  },
]

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#quality', label: 'Plant' },
  { href: '#product', label: '20L' },
  { href: '#videos', label: 'Videos' },
  { href: '#journey', label: 'Journey' },
  { href: '#mandya', label: 'Mandya' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Order' },
]

const qualityPoints = [
  {
    tag: 'Filtration',
    title: 'RO stack you can stand behind',
    text: 'Multi-stage reverse osmosis is tuned for drinking water — fewer doubts, more clarity in every can.',
  },
  {
    tag: 'Hygiene',
    title: 'Filled like it matters',
    text: 'Sealed 20L cans, careful handling at the plant, and a routine built around cleanliness — not shortcuts.',
  },
  {
    tag: 'Local',
    title: 'Miles matter less here',
    text: 'Packed near Mandya so routes stay short, cans stay fresh, and you deal with the same local team.',
  },
]

const journeySteps = [
  {
    step: '1',
    title: 'RO treatment',
    text: 'Water passes through our plant process before it ever touches your can.',
  },
  {
    step: '2',
    title: 'Sanitised fill',
    text: '20 litre containers are filled in a controlled, hygiene-first workflow.',
  },
  {
    step: '3',
    title: 'Sealed & labelled',
    text: 'Ready for transport with your MP Water RO Plant identity on every unit.',
  },
  {
    step: '4',
    title: 'Route to you',
    text: 'We schedule drops across Mandya city and nearby villages — you choose call or WhatsApp.',
  },
]

const bentoCells = [
  {
    wide: true,
    icon: '🏠',
    title: 'Homes & kitchens',
    text: 'Daily cooking, drinking, and guests — one 20L can keeps the week flowing.',
  },
  {
    wide: false,
    icon: '🏪',
    title: 'Shops',
    text: 'Retail counters and small eateries that need steady refills.',
  },
  {
    wide: false,
    icon: '🎉',
    title: 'Functions',
    text: 'Extra cans when gatherings spike — tell us the date and count early.',
  },
  {
    wide: true,
    icon: '📍',
    title: 'Mandya-first',
    text: 'City lanes and surrounding villages on our delivery map.',
  },
]

const faqItems = [
  {
    q: 'What size bottles do you deliver?',
    a: 'We specialise in 20 litre purified drinking water cans — the size most families and small businesses use with a dispenser.',
  },
  {
    q: 'Which areas do you cover?',
    a: 'Mandya city and nearby villages. Share your landmark or area name when you order and we will confirm coverage and timing.',
  },
  {
    q: 'How do I place an order?',
    a: 'Use the form below to open WhatsApp with your details filled in, call us, or email mpwatersupply.mandya@gmail.com with your area and how many 20L cans you need.',
  },
  {
    q: 'How do I know the rate?',
    a: 'Rates can change with supply and distance. Call or message for today’s price and any minimum quantity.',
  },
  {
    q: 'Where is the RO plant?',
    a: (
      <>
        Open{' '}
        <a className="faq-inline-link" href={MAPS_URL} target="_blank" rel="noreferrer">
          our location on Google Maps
        </a>{' '}
        for directions. The same link is in the Mandya section, order sidebar, and footer.
      </>
    ),
  },
]

/** Change to empty string when you are fully live */
const LAUNCH_WINDOW_LABEL = 'about 1 week'

function LaunchSoonBanner() {
  return (
    <div className="launch-soon" role="status" aria-live="polite">
      <div className="launch-soon__inner">
        <p className="launch-soon__ribbon">
          <span className="launch-soon__rocket" aria-hidden>
            🚀
          </span>
          Opening soon — we&apos;re starting up
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
            <strong>{LAUNCH_WINDOW_LABEL}</strong>
            <span>Target go-live</span>
          </div>
          <div className="launch-soon__chip">
            <div className="launch-soon__chip-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M12 3c-4 6-7 8-7 12a7 7 0 0014 0c0-4-3-6-7-12z" />
              </svg>
            </div>
            <strong>RO plant</strong>
            <span>Final checks</span>
          </div>
          <div className="launch-soon__chip">
            <div className="launch-soon__chip-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M3 11h12v8H3v-8zM15 11h3l3 3v5h-3" />
                <circle cx="7.5" cy="19" r="1.75" fill="currentColor" stroke="none" />
                <circle cx="18" cy="19" r="1.75" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <strong>20L routes</strong>
            <span>Homes &amp; shops</span>
          </div>
        </div>

        <p className="launch-soon__text">
          Full delivery across Mandya city and nearby villages begins in <strong>{LAUNCH_WINDOW_LABEL}</strong>. You can
          still message us on WhatsApp to <strong>save your place</strong> or ask questions — we&apos;ll confirm slots
          as we open.
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

  const closeMenu = () => setMenuOpen(false)

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
            <img src={logoPng} alt="MP Water RO Plant logo" width="96" height="96" />
            <div className="brand-text">
              <strong>MP WATER RO PLANT</strong>
              <span>Purified · Pure health</span>
            </div>
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`nav${menuOpen ? ' is-open' : ''}`} aria-label="Main">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label}
              </a>
            ))}
            <a className="nav-cta" href={PHONE_TEL} onClick={closeMenu}>
              {PHONE_DISPLAY}
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__mesh" aria-hidden />
          <LaunchSoonBanner />
          <div className="hero__grid">
            <div className="hero__copy">
              <p className="hero__eyebrow">
                Mandya · 20 litre cans · RO plant · <span className="hero__eyebrow-soon">Starting soon</span>
              </p>
              <h1>
                Water that carries
                <br />
                <em>your trust</em> home.
              </h1>
              <p className="hero__tagline">
                MP Water RO Plant fills and delivers sealed 20L purified cans across Mandya city and surrounding
                villages — built for families, shops, and offices that want straightforward, local supply.
              </p>
              <div className="hero__badges">
                <span className="hero-badge">RO purified</span>
                <span className="hero-badge">Sealed 20L</span>
                <span className="hero-badge">Local routes</span>
              </div>
              <div className="hero__actions">
                <a className="btn btn--primary" href="#contact">
                  Order cans
                </a>
                <a className="btn btn--light" href={WHATSAPP} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a className="btn btn--light" href={PHONE_TEL}>
                  Call
                </a>
              </div>
            </div>
            <div className="hero__visual">
              <div className="hero__visual-stack">
                <div className="hero__logo-frame">
                  <div className="hero__logo-inner">
                    <img src={logoPng} alt="" width="360" height="280" />
                  </div>
                </div>
                <a className="hero__slot-note" href={WHATSAPP} target="_blank" rel="noreferrer">
                  Opening in ~1 week — WhatsApp us to get on the delivery list.
                </a>
              </div>
            </div>
          </div>
        </section>

        <WaveDivider />
        <div style={{ background: 'var(--mist)', marginTop: '-1px' }}>
          <section className="section section--mist" id="quality" style={{ paddingTop: 48 }}>
            <div className="section__inner">
              <p className="section-kicker">Inside the plant logic</p>
              <h2 className="section-title">Three anchors, one pour</h2>
              <p className="section-lead">
                No borrowed slogans — just how we think about every can that leaves MP Water RO Plant.
              </p>
              <div className="quality-deck">
                {qualityPoints.map((item) => (
                  <article key={item.title} className="quality-card">
                    <span className="tag">{item.tag}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="section" id="product">
          <div className="section__inner">
            <p className="section-kicker">The hero SKU</p>
            <h2 className="section-title">One size. Serious volume.</h2>
            <p className="section-lead">
              Twenty litres is the sweet spot for dispensers, busy kitchens, and small commercial counters — we
              stay focused on doing it well.
            </p>
            <div className="product-spotlight">
              <div className="product-mega" aria-hidden>
                20<span>litre</span>
              </div>
              <div>
                <h3>Purified drinking water can</h3>
                <p>
                  RO-treated water, hygienic fill, sealed container. Ideal wherever a 20L can is the daily rhythm
                  — homes, tuition centres, clinics, and neighbourhood stores around Mandya.
                </p>
                <p className="price-note">Ask for today’s rate and delivery minimum — we’ll confirm on call or WhatsApp.</p>
                <div className="hero__actions" style={{ marginTop: '22px' }}>
                  <a className="btn btn--primary" href={PHONE_TEL}>
                    Call {PHONE_DISPLAY}
                  </a>
                  <a className="btn btn--outline" href="#contact">
                    Quick order form
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--videos" id="videos">
          <div className="section__inner">
            <p className="section-kicker">Creative preview</p>
            <h2 className="section-title">A quick AI preview</h2>
            <p className="section-lead">
              These are <strong>AI concept videos</strong> to show the idea: ₹5 coin box water and 20L can delivery use
              cases for homes, hospitals, and commercial places around Mandya.
            </p>

            <div className="video-grid">
              {VIDEO_ITEMS.map((v) => (
                <article key={v.src} className="video-card">
                  <div className="video-card__media">
                    <video controls playsInline preload="metadata">
                      <source src={`${import.meta.env.BASE_URL}${v.src}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="video-card__meta">
                    <h3>{v.title}</h3>
                    <p>{v.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--dark" id="journey">
          <div className="section__inner">
            <p className="section-kicker">Transparency, staged</p>
            <h2 className="section-title">From membrane to your matka</h2>
            <p className="section-lead" style={{ color: 'rgba(255,255,255,0.75)' }}>
              A simple four-step path — so you know what happens before the can reaches your doorstep.
            </p>
            <div className="timeline">
              {journeySteps.map((s) => (
                <div key={s.step} className="timeline-step" data-step={s.step}>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WaveDivider flip toNavy />

        <section className="section delivery" id="mandya">
          <div className="section__inner">
            <p className="section-kicker">Hyper-local routing</p>
            <h2 className="section-title">Mandya city &amp; village lanes</h2>
            <div className="delivery__grid">
              <div>
                <p className="section-lead">
                  We optimise for short hops and repeat customers — not nationwide logistics theatre. Tell us
                  your area; we’ll tell you honestly if you’re on today’s route.
                </p>
                <ul className="pulse-list">
                  <li>20L cans only — depth over catalogue clutter</li>
                  <li>Landmark-friendly addressing for villages</li>
                  <li>WhatsApp-friendly rescheduling when plans shift</li>
                  <li>Direct line to the team that actually loads the vehicle</li>
                </ul>
              </div>
              <div className="area-box" id="location">
                <h4>Plant location</h4>
                <p style={{ marginBottom: '14px' }}>
                  Visit or send drivers here — opens in{' '}
                  <a className="maps-link" href={MAPS_URL} target="_blank" rel="noreferrer">
                    Google Maps
                  </a>
                  .
                </p>
                <a className="maps-cta" href={MAPS_URL} target="_blank" rel="noreferrer">
                  Open map &amp; directions
                </a>
                <h4 style={{ marginTop: '22px' }}>Drop a pin in words</h4>
                <p style={{ marginBottom: '16px' }}>
                  Mention mandal, village name, school or temple nearby — whatever helps our driver find you on
                  the first try.
                </p>
                <h4>Reach us</h4>
                <p>
                  <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
                  <br />
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">
                    Open WhatsApp
                  </a>
                  <br />
                  <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                    Instagram @mp_water_supply
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
            <p className="section-kicker">Where 20L fits</p>
            <h2 className="section-title">A bento of real Mandya use cases</h2>
            <p className="section-lead">
              Mixed tiles, one product — pick the story that sounds like yours.
            </p>
            <div className="bento">
              {bentoCells.map((cell) => (
                <div key={cell.title} className={`bento__cell${cell.wide ? ' bento__cell--wide' : ''}`}>
                  <div className="bento__icon">{cell.icon}</div>
                  <h4>{cell.title}</h4>
                  <p>{cell.text}</p>
                </div>
              ))}
            </div>
            <div className="about-strip">
              <strong style={{ color: 'var(--ink)' }}>MP Water RO Plant</strong> — Purified Water Supply — Pure
              Health. A Mandya-area RO plant with delivery that stays human: call, message, get a straight answer.
            </div>
          </div>
        </section>

        <section className="section section--mist" id="faq">
          <div className="section__inner">
            <p className="section-kicker">Straight answers</p>
            <h2 className="section-title">FAQ</h2>
            <p className="section-lead">Tap a question — no carousel, no fluff.</p>
            <div className="faq-list">
              {faqItems.map((item, i) => (
                <div key={item.q} className={`faq-item${openFaq === i ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <span aria-hidden>+</span>
                  </button>
                  <div className="faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="contact" style={{ paddingBottom: 100 }}>
          <div className="section__inner">
            <p className="section-kicker">Order desk</p>
            <h2 className="section-title">Send a WhatsApp order in seconds</h2>
            <p className="section-lead contact-intro">
              The form composes your message — you send it when WhatsApp opens. You can also call us or write to{' '}
              <a href={MAILTO}>{EMAIL}</a>.
            </p>
            <div className="contact-grid">
              <form className="contact-form" onSubmit={handleSubmit}>
                <label htmlFor="name">Your name</label>
                <input id="name" name="name" type="text" required autoComplete="name" />

                <label htmlFor="phone">Mobile number</label>
                <input id="phone" name="phone" type="tel" required autoComplete="tel" />

                <label htmlFor="quantity">20L cans</label>
                <select id="quantity" name="quantity" defaultValue="2">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5 or more</option>
                </select>

                <label htmlFor="area">Area / village / landmark</label>
                <input id="area" name="area" type="text" required placeholder="Mandya — …" />

                <label htmlFor="note">Notes (optional)</label>
                <textarea id="note" name="note" placeholder="Time window, floor, gate…" />

                <button type="submit" className="btn btn--primary">
                  Compose WhatsApp order
                </button>
                {formStatus === 'opened' && (
                  <p className="form-success">
                    If WhatsApp did not open, dial <a href={PHONE_TEL}>{PHONE_DISPLAY}</a> or email{' '}
                    <a href={MAILTO}>{EMAIL}</a>.
                  </p>
                )}
              </form>
              <div className="contact-side">
                <p style={{ margin: 0, fontSize: '1.12rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.92)' }}>
                  Voice orders welcome — especially for first-time delivery pins.
                </p>
                <h4>Phone</h4>
                <p>
                  <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
                </p>
                <h4>WhatsApp</h4>
                <p>
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">
                    Message us
                  </a>
                </p>
                <h4>Instagram</h4>
                <p>
                  <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                    @mp_water_supply
                  </a>
                </p>
                <h4>Email</h4>
                <p className="contact-email">
                  <a href={MAILTO}>{EMAIL}</a>
                </p>
                <h4>Location</h4>
                <p>
                  <a className="maps-link maps-link--on-dark" href={MAPS_URL} target="_blank" rel="noreferrer">
                    Google Maps — directions
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
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <strong>MP WATER RO PLANT</strong>
            Purified water supply · Pure health
            <br />
            20L cans · Mandya city &amp; villages
          </div>
          <div>
            <strong>Jump</strong>
            <a href="#product">20L product</a>
            {' · '}
            <a href="#journey">Journey</a>
            {' · '}
            <a href="#faq">FAQ</a>
            {' · '}
            <a href="#contact">Order</a>
          </div>
          <div>
            <strong>Contact</strong>
            <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
            <br />
            <a href={MAILTO}>{EMAIL}</a>
          </div>
          <div className="footer-social">
            <strong>Follow</strong>
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
          © {new Date().getFullYear()} MP Water RO Plant. Purified Water Supply. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default App
