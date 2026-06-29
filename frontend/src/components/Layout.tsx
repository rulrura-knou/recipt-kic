import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  const navLink = (to: string, label: string) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-base font-bold text-slate-800 tracking-tight">
            지출관리
          </Link>
          <nav className="flex gap-1">
            {navLink('/', '대시보드')}
            {navLink('/upload', '영수증 업로드')}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
