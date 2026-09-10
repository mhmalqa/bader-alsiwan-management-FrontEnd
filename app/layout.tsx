import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './feature.css'
import './professional-ui.css'
import './table-ui.css'
import './quick-create.css'
import './quick-payment.css'
import './full-create-modal.css'
import './domain-pages.css'
import './premium-design.css'
import './modal-polish.css'
import './modal-layout-fix.css'
import './modal-actions.css'
import './required-label-fix.css'
import './navigation-tree.css'
import './navigation-tree-fix.css'
import './operations-ui.css'
import './states.css'
import './interface-polish.css'
import './preview-modal.css'
import './report-actions.css'
import './institutional-output.css'
import './document-card-fix.css'
import './searchable-select.css'
import './settlement-composer.css'
import './payment-collection.css'
import './collection-dashboard.css'
import './app-toast.css'
import './unified-dialog.css'

export const metadata: Metadata = {
  title: 'بدر الصيوان للعقارات | إدارة العقارات والتحصيل',
  description: 'نظام إدارة العقارات والتحصيل لشركة بدر الصيوان للعقارات',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f7f4',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
