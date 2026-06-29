interface Props {
  label: string
  amount: number
  count: number
  accent?: boolean
}

export default function SummaryCard({ label, amount, count, accent }: Props) {
  return (
    <div
      className={`rounded-2xl p-6 ${
        accent
          ? 'bg-indigo-600 text-white'
          : 'bg-white border border-slate-100 shadow-sm'
      }`}
    >
      <p className={`text-sm font-medium ${accent ? 'text-indigo-200' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 tracking-tight ${accent ? 'text-white' : 'text-slate-900'}`}>
        {amount.toLocaleString('ko-KR')}
        <span className={`text-lg font-medium ml-1 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>원</span>
      </p>
      <p className={`text-xs mt-2 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>
        총 {count}건
      </p>
    </div>
  )
}
