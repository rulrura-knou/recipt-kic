import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadReceipt } from '../api/client'
import type { Expense } from '../types/expense'

type State =
  | { status: 'idle' }
  | { status: 'loading'; previewUrl: string }
  | { status: 'done'; previewUrl: string; expense: Expense }
  | { status: 'error'; message: string }

export default function UploadPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ status: 'idle' })
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setState({ status: 'error', message: 'jpg, png, webp 이미지 파일만 업로드할 수 있습니다.' })
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setState({ status: 'loading', previewUrl })
    try {
      const expense = await uploadReceipt(file)
      setState({ status: 'done', previewUrl, expense })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.'
      setState({ status: 'error', message })
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    if (state.status === 'loading' || state.status === 'done') {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState({ status: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  /* ── 업로드 영역 ── */
  if (state.status === 'idle') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">영수증 업로드</h1>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <div className="text-4xl mb-3 text-slate-300">↑</div>
          <p className="text-slate-700 font-medium">영수증을 여기에 끌어다 놓거나</p>
          <p className="text-indigo-600 font-medium mt-1">클릭해서 파일 선택</p>
          <p className="text-slate-400 text-sm mt-3">jpg · png · webp</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
    )
  }

  /* ── 로딩 중 ── */
  if (state.status === 'loading') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">영수증 분석 중…</h1>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <img src={state.previewUrl} alt="업로드된 영수증" className="w-full max-h-72 object-contain bg-slate-50 p-4" />
          <div className="p-6 flex items-center gap-3 border-t border-slate-100">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-slate-600 text-sm">Upstage AI가 영수증 내용을 읽고 있습니다…</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── 오류 ── */
  if (state.status === 'error') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">영수증 업로드</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium mb-1">분석에 실패했습니다</p>
          <p className="text-red-500 text-sm">{state.message}</p>
        </div>
        <button
          onClick={reset}
          className="mt-4 w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  /* ── 결과 미리보기 ── */
  const { expense, previewUrl } = state
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">분석 결과</h1>
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* 영수증 썸네일 */}
        <img src={previewUrl} alt="영수증" className="w-full max-h-52 object-contain bg-slate-50 p-3" />

        {/* 인식 결과 */}
        <div className="p-6 space-y-4 border-t border-slate-100">
          <Row label="가게명" value={expense.store_name} />
          <Row label="날짜" value={expense.date} />
          <Row label="카테고리" value={expense.category} />
          <Row
            label="합계"
            value={`${expense.total_amount.toLocaleString('ko-KR')}원`}
            bold
          />

          {expense.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">품목</p>
              <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                {expense.items.map((item, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-900 font-medium">{item.price.toLocaleString('ko-KR')}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          다시 올리기
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          저장하기
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? 'text-lg font-bold text-slate-900' : 'text-slate-800 font-medium'}`}>
        {value}
      </span>
    </div>
  )
}
