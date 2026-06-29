export interface ReceiptItem {
  name: string
  price: number
  quantity?: number
}

export interface Expense {
  id: string
  date: string
  store_name: string
  total_amount: number
  items: ReceiptItem[]
  category: string
  raw_ie_response: string
  image_path: string
  created_at: string
  updated_at: string
}

export interface ExpenseUpdate {
  date?: string
  store_name?: string
  total_amount?: number
  items?: ReceiptItem[]
  category?: string
}

export interface CategorySummary {
  category: string
  count: number
  amount: number
}

export interface ExpenseSummary {
  total_count: number
  total_amount: number
  this_month_count: number
  this_month_amount: number
  this_month: { year: number; month: number }
  by_category: CategorySummary[]
}
