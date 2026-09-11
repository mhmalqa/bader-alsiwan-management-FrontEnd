'use client'

import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import {
  BarChart3,
  Building2,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Layers3,
  Lock,
  Mail,
  Quote,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import { login } from '@/features/auth/api'
import { HttpError } from '@/lib/api/http'
import '../login-screen.css'

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const features = [
  { label: 'تجربة سهلة', icon: Sparkles },
  { label: 'إدارة متكاملة', icon: Layers3 },
  { label: 'تقارير ذكية', icon: BarChart3 },
  { label: 'أمان وخصوصية', icon: ShieldCheck },
]

const stats = [
  { value: '+10,000', label: 'عقار مُدار', icon: Building2 },
  { value: '+25,000', label: 'مستأجر ومالك', icon: Landmark },
  { value: '+50,000', label: 'عقد مُنجز', icon: Layers3 },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const session = await login(String(form.get('email')), String(form.get('password')))
      sessionStorage.setItem('accessToken', session.accessToken)
      sessionStorage.setItem('authUser', JSON.stringify(session.user))
      router.replace('/dashboard')
    } catch (reason) {
      setError(reason instanceof HttpError ? reason.message : 'تعذر الاتصال بالخادم.')
      setSubmitting(false)
    }
  }

  return (
    <main className={`${plexArabic.className} sy-login`} dir="rtl">
      <section className="sy-login-panel" aria-label="تسجيل الدخول">
        <div className="sy-login-pattern" aria-hidden="true" />
        <div className="sy-login-ribbons" aria-hidden="true">
          <IdentityRibbons />
        </div>
        <div className="sy-login-panel-inner">
          <div className="sy-login-brand">
            <BrandMark />
            <div>
              <strong>نظام إدارة الأملاك</strong>
              <span>إدارة أذكى لمستقبل أكثر استقراراً</span>
            </div>
          </div>

          <header className="sy-login-welcome">
            <h1>مرحباً بعودتك</h1>
            <p>سجّل الدخول للوصول إلى لوحة التحكم</p>
          </header>

          <form onSubmit={submit} className="sy-login-form">
            <div className="sy-login-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <div className="sy-login-input">
                <Mail strokeWidth={1.6} />
                <input
                  id="email"
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="sy-login-field">
              <label htmlFor="password">كلمة المرور</label>
              <div className="sy-login-input">
                <Lock strokeWidth={1.6} />
                <input
                  id="password"
                  required
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="أدخل كلمة المرور"
                  disabled={submitting}
                />
                <button
                  className="sy-login-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'إخفاء النص' : 'إظهار النص'}
                >
                  {showPassword ? <EyeOff strokeWidth={1.6} size={18} /> : <Eye strokeWidth={1.6} size={18} />}
                </button>
              </div>
            </div>

            <div className="sy-login-row">
              <label className="sy-login-remember">
                <input type="checkbox" name="remember" />
                تذكرني
              </label>
              <button className="sy-login-forgot" type="button">
                نسيت كلمة المرور؟
              </button>
            </div>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <button className="sy-login-submit" disabled={submitting} type="submit">
              {submitting ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
              {!submitting && <ArrowLeft strokeWidth={1.8} size={18} />}
            </button>

            <div className="sy-login-divider">أو</div>

            <button className="sy-login-sso" type="button" disabled={submitting}>
              <Landmark strokeWidth={1.6} size={18} />
              الدخول عبر حساب الحكومة الإلكترونية
            </button>
          </form>

          <div className="sy-login-footnote">
            <CardSkyline />
            <p>إدارة ذكية للأملاك باحترافية ووضوح</p>
          </div>
        </div>
      </section>

      <section className="sy-login-hero" aria-label="مقدمة المنصة">
        <Image
          src="/login/hero.jpg"
          alt="أحياء سكنية حديثة أمام أفق مدينة سورية"
          fill
          priority
          sizes="64vw"
          className="sy-login-hero-photo"
        />
        <div className="sy-login-hero-wash" aria-hidden="true" />

        <div className="sy-login-hero-content">
          <div className="sy-login-hero-bar">
            <nav className="sy-login-nav" aria-label="روابط تعريفية">
              <a href="#about">عن النظام</a>
              <a href="#features">المزايا</a>
              <a href="#contact">تواصل معنا</a>
            </nav>
            <div className="sy-login-bar-end">
              <span className="sy-login-lang">
                <Globe strokeWidth={1.6} size={16} />
                العربية
              </span>
              <button className="sy-login-signup" type="button">
                إنشاء حساب جديد
              </button>
            </div>
          </div>

          <div className="sy-login-copy" id="about">
            <h2>
              عقارات أكثر قيمة
              <br />
              لمجتمع أكثر استقراراً
            </h2>
            <p>
              منصة متكاملة لإدارة العقارات والملاك والمستأجرين والعقود، بمنهجية احترافية تمنح الجهات
              المشغّلة رؤية أوضح، وتحصيلاً أدق، ومستقبلاً سكنياً أكثر استقراراً.
            </p>
            <hr className="sy-login-rule" />
            <ul className="sy-login-features" id="features">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <li key={feature.label}>
                    <i>
                      <Icon strokeWidth={1.7} />
                    </i>
                    {feature.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="sy-login-bottom">
            <blockquote className="sy-login-quote" id="contact">
              <Quote strokeWidth={1.5} />
              <p>
                منازل أفضل..
                <br />
                لمستقبل أجمل
              </p>
            </blockquote>
            <dl className="sy-login-stats">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label}>
                    <Icon strokeWidth={1.6} />
                    <div>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
      </section>
    </main>
  )
}

function BrandMark() {
  return (
    <span className="sy-login-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M10 7.2 16 4l6 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8.5 13.5 16 9.2l7.5 4.3V27H8.5V13.5Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M13 27v-6.2h6V27" stroke="currentColor" strokeWidth="1.4" />
        <path d="M13.2 17.2h2.1M16.7 17.2h2.1M13.2 20.2h2.1M16.7 20.2h2.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="11.2" cy="6.2" r="0.8" fill="#d4af7c" />
        <circle cx="16" cy="4.6" r="0.8" fill="#d4af7c" />
        <circle cx="20.8" cy="6.2" r="0.8" fill="#d4af7c" />
      </svg>
    </span>
  )
}

function IdentityRibbons() {
  return (
    <svg viewBox="0 0 168 980" preserveAspectRatio="none">
      <path d="M170-10c-80 140-10 250-70 390s40 230-30 360 50 180 20 250h110V-10Z" fill="#ffffff" opacity="0.86" />
      <path d="M40-20c40 160-20 270 30 410s-50 220 10 350-20 180 20 240h40c-30-90 20-170-10-260s70-220-20-360-40-250-30-380Z" fill="#8faa88" opacity="0.42" />
      <path d="M120-10c-50 170 10 260-40 400s30 240-20 360 40 170 10 230h90V-10Z" fill="#e7efe3" opacity="0.7" />
    </svg>
  )
}

function CardSkyline() {
  return (
    <svg className="sy-login-skyline" viewBox="0 0 280 42" fill="none" aria-hidden="true">
      <path
        d="M8 36h264M18 36V24l8-5 8 5v12M42 36V18h16v18M64 36V22l10-8 10 8v14M96 36V16h8v-6h6v6h8v20M128 36V20h18v16M154 36V14l12-8 12 8v22M184 36V19h14v17M206 36V12l8-6 8 6v24M236 36V22c4-8 12-8 16 0v14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="166" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}
