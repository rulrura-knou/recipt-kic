import { useEffect, useState } from 'react'
import { getSummary, listExpenses } from '../api/client'
import type { Expense, ExpenseSummary } from '../types/expense'
import SummaryCard from '../components/SummaryCard'
import ExpenseCard from '../components/ExpenseCard'
import CategoryDonut from '../components/CategoryDonut'

export default function DashboardPage() {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getSummary(), listExpenses()])
      .then(([s, e]) => {
        setSummary(s)
        setExpenses(e)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
        데이터를 불러오는 중 오류가 발생했습니다: {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 요약 카드 */}
      <section>
        <h1 className="text-xl font-bold text-slate-800 mb-4">지출 요약</h1>
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            label="총 지출"
            amount={summary?.total_amount ?? 0}
            count={summary?.total_count ?? 0}
          />
          <SummaryCard
            label={`${summary?.this_month.month}월 지출`}
            amount={summary?.this_month_amount ?? 0}
            count={summary?.this_month_count ?? 0}
            accent
          />
        </div>
      </section>

      {/* 카테고리별 요약 */}
      {summary && summary.by_category.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            카테고리별 지출
          </h2>
          <CategoryDonut
            categories={summary.by_category}
            total={summary.total_amount}
          />
        </section>
      )}

      {/* 지출 목록 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          지출 내역
        </h2>
        {expenses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base">지출 내역이 없습니다.</p>
            <p className="text-sm mt-1">영수증을 업로드해서 첫 지출을 기록해보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <ExpenseCard key={e.id} expense={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
