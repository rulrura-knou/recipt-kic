import type { CategorySummary } from '../types/expense'

const COLORS: Record<string, string> = {
  '식비': '#fdba74',   // orange-300
  '교통': '#93c5fd',   // blue-300
  '생활용품': '#86efac', // green-300
  '의료': '#fca5a5',   // red-300
  '문화': '#d8b4fe',   // purple-300
  '기타': '#cbd5e1',   // slate-300
}
const FALLBACK = ['#fdba74', '#93c5fd', '#86efac', '#fca5a5', '#d8b4fe', '#cbd5e1']

const LABEL_CLASSES: Record<string, string> = {
  '식비': 'bg-orange-100 text-orange-700',
  '교통': 'bg-blue-100 text-blue-700',
  '생활용품': 'bg-green-100 text-green-700',
  '의료': 'bg-red-100 text-red-700',
  '문화': 'bg-purple-100 text-purple-700',
  '기타': 'bg-slate-100 text-slate-600',
}

const R = 35
const CIRCUMFERENCE = 2 * Math.PI * R

export default function CategoryDonut({
  categories,
  total,
}: {
  categories: CategorySummary[]
  total: number
}) {
  let accumulated = 0

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-6">
        {/* 도넛 차트 */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="14" />
            <g transform="rotate(-90 50 50)">
              {categories.map((cat, i) => {
                const len = total > 0 ? (cat.amount / total) * CIRCUMFERENCE : 0
                const dashOffset = -accumulated
                accumulated += len
                return (
                  <circle
                    key={cat.category}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={COLORS[cat.category] ?? FALLBACK[i % FALLBACK.length]}
                    strokeWidth="14"
                    strokeDasharray={`${len} ${CIRCUMFERENCE}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                  />
                )
              })}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[10px] text-slate-400">총 지출</span>
            <span className="text-xs font-bold text-slate-800 leading-tight text-center px-1">
              {total.toLocaleString('ko-KR')}원
            </span>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex-1 space-y-2">
          {categories.map((cat) => {
            const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0
            const labelClass = LABEL_CLASSES[cat.category] ?? LABEL_CLASSES['기타']
            return (
              <div key={cat.category} className="flex items-center gap-2 text-sm">
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${labelClass}`}>
                  {cat.category}
                </span>
                <span className="text-slate-400 text-xs w-7 text-right">{pct}%</span>
                <span className="flex-1 text-slate-800 font-medium text-right text-xs">
                  {cat.amount.toLocaleString('ko-KR')}원
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
