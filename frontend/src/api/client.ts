import type { Expense, ExpenseSummary, ExpenseUpdate } from '../types/expense'

const BASE = '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = err.detail
    const message = typeof detail === 'object' ? detail?.message : detail
    throw new Error(message ?? `오류 ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function uploadReceipt(file: File): Promise<Expense> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/receipts/upload`, { method: 'POST', body: form })
  return handleResponse<Expense>(res)
}

export async function getSummary(): Promise<ExpenseSummary> {
  const res = await fetch(`${BASE}/expenses/summary`)
  return handleResponse<ExpenseSummary>(res)
}

export async function listExpenses(params?: {
  from_date?: string
  to_date?: string
  category?: string
}): Promise<Expense[]> {
  const query = new URLSearchParams()
  if (params?.from_date) query.set('from_date', params.from_date)
  if (params?.to_date) query.set('to_date', params.to_date)
  if (params?.category) query.set('category', params.category)
  const res = await fetch(`${BASE}/expenses?${query}`)
  return handleResponse<Expense[]>(res)
}

export async function getExpense(id: string): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses/${id}`)
  return handleResponse<Expense>(res)
}

export async function updateExpense(id: string, data: ExpenseUpdate): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Expense>(res)
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${id}`, { method: 'DELETE' })
  return handleResponse<void>(res)
}
