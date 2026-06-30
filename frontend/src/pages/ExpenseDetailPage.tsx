import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getExpense, updateExpense, deleteExpense } from '../api/client'
import type { Expense, ReceiptItem } from '../types/expense'

const CATEGORIES = ['식비', '교통', '생활용품', '의료', '문화', '기타']

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 수정 폼 상태
  const [form, setForm] = useState({
    store_name: '',
    date: '',
    total_amount: 0,
    category: '',
    items: [] as ReceiptItem[],
  })

  useEffect(() => {
    if (!id) return
    getExpense(id)
      .then((e) => {
        setExpense(e)
        setForm({
          store_name: e.store_name,
          date: e.date,
          total_amount: e.total_amount,
          category: e.category,
          items: e.items,
        })
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateExpense(id, form)
      setExpense(updated)
      setEditing(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('이 지출 항목을 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      await deleteExpense(id)
      navigate('/')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
      setDeleting(false)
    }
  }

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const removeItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { name: '', price: 0 }] }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error ?? '항목을 찾을 수 없습니다.'}</p>
        <Link to="/" className="text-indigo-600 text-sm font-medium hover:underline">← 대시보드로</Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="text-slate-400 text-sm hover:text-slate-600">← 목록으로</Link>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              수정
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-1.5 text-sm font-medium border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5">
        {editing ? (
          /* ── 수정 폼 ── */
          <>
            <Field label="가게명">
              <input
                type="text"
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
            <Field label="날짜">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>
            <Field label="카테고리">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="합계 (원)">
              <input
                type="number"
                value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
            </Field>

            {/* 품목 */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">품목</p>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="품목명"
                      value={item.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    />
                    <input
                      type="number"
                      placeholder="가격"
                      value={item.price}
                      onChange={(e) => updateItem(i, 'price', Number(e.target.value))}
                      className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => removeItem(i)}
                      className="text-slate-400 hover:text-red-400 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + 품목 추가
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setEditing(false); setForm({ store_name: expense.store_name, date: expense.date, total_amount: expense.total_amount, category: expense.category, items: expense.items }) }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </>
        ) : (
          /* ── 상세 보기 ── */
          <>
            {expense.image_url && (
              <ReceiptImage url={`/api/expenses/${expense.id}/image`} alt={expense.store_name} />
            )}
            <div>
              <p className="text-2xl font-bold text-slate-900">{expense.store_name}</p>
              <p className="text-slate-400 text-sm mt-0.5">{expense.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                {expense.category || '기타'}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">품목</p>
              {expense.items.length > 0 ? (
                <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                  {expense.items.map((item, i) => (
                    <div key={i} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-900 font-medium">{item.price.toLocaleString('ko-KR')}원</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">품목 정보 없음</p>
              )}
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <span className="text-sm text-slate-500">합계</span>
              <span className="text-xl font-bold text-slate-900">
                {expense.total_amount.toLocaleString('ko-KR')}원
              </span>
            </div>
            <p className="text-xs text-slate-300">
              등록: {new Date(expense.created_at).toLocaleString('ko-KR')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function ReceiptImage({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="-mx-6 -mt-6 mb-2 rounded-t-2xl overflow-hidden bg-slate-100">
      <img
        src={url}
        alt={alt}
        className="w-full max-h-72 object-contain"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}
