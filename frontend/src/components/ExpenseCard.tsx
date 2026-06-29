import { Link } from 'react-router-dom'
import type { Expense } from '../types/expense'

const CATEGORY_COLOR: Record<string, string> = {
  식비: 'bg-orange-100 text-orange-700',
  교통: 'bg-blue-100 text-blue-700',
  생활용품: 'bg-green-100 text-green-700',
  의료: 'bg-red-100 text-red-700',
  문화: 'bg-purple-100 text-purple-700',
  기타: 'bg-slate-100 text-slate-600',
}

export default function ExpenseCard({ expense }: { expense: Expense }) {
  const color = CATEGORY_COLOR[expense.category] ?? CATEGORY_COLOR['기타']

  return (
    <Link
      to={`/expenses/${expense.id}`}
      className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 truncate">{expense.store_name}</span>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
            {expense.category || '기타'}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-0.5">{expense.date}</p>
      </div>
      <p className="text-base font-bold text-slate-900 ml-4 shrink-0">
        {expense.total_amount.toLocaleString('ko-KR')}원
      </p>
    </Link>
  )
}
