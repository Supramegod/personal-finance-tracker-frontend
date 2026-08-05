import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchAIConsent,
  fetchLatestAIInsight,
  fetchMonthlyAIInsight,
  updateAIConsent,
} from '@/store/slices/aiInsightSlice'
import { cn, formatIDR } from '@/lib/utils'

const healthStyle = {
  good: { label: 'Baik', badge: 'bg-income-light text-income-dark', icon: 'text-income bg-income-light' },
  watch: { label: 'Perlu dijaga', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600 bg-amber-50' },
  risk: { label: 'Berisiko', badge: 'bg-expense-light text-expense-dark', icon: 'text-expense bg-expense-light' },
}

export default function AIInsightPanel({ compact = false, month, onMonthChange }) {
  const dispatch = useAppDispatch()
  const { activeGroupId } = useAppSelector((state) => state.auth)
  const state = useAppSelector((value) => value.aiInsight)
  const [confirmMode, setConfirmMode] = useState(null)

  const insight = compact ? state.latest : state.monthly
  const insightStatus = compact ? state.latestStatus : state.monthlyStatus

  useEffect(() => {
    if (activeGroupId) dispatch(fetchAIConsent(activeGroupId))
  }, [activeGroupId, dispatch])

  useEffect(() => {
    if (!state.consent?.enabled) return
    if (compact) dispatch(fetchLatestAIInsight())
    else if (month) dispatch(fetchMonthlyAIInsight(month))
  }, [compact, dispatch, month, state.consent?.enabled])

  // Aktivasi memicu proses background. Poll hanya selama hasil belum selesai.
  useEffect(() => {
    if (!state.consent?.enabled || !['not_available', 'pending', 'processing'].includes(insight?.status)) return
    const timer = window.setInterval(() => {
      if (compact) dispatch(fetchLatestAIInsight())
      else if (month) dispatch(fetchMonthlyAIInsight(month))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [compact, dispatch, insight?.status, month, state.consent?.enabled])

  const setConsent = async (enabled) => {
    setConfirmMode(null)
    try {
      await dispatch(updateAIConsent({ groupId: activeGroupId, enabled })).unwrap()
      if (enabled) {
        if (compact) dispatch(fetchLatestAIInsight())
        else if (month) dispatch(fetchMonthlyAIInsight(month))
      }
    } catch {
      // Pesan dari slice ditampilkan di panel.
    }
  }

  if (!activeGroupId || state.consentStatus === 'loading' || state.consentStatus === 'idle') {
    return <PanelSkeleton compact={compact} />
  }

  if (state.consentStatus === 'failed') {
    return <MessagePanel title="Insight AI belum tersedia" message={state.error} onRetry={() => dispatch(fetchAIConsent(activeGroupId))} />
  }

  if (!state.consent?.enabled) {
    return (
      <>
        <section className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-xl text-primary">✦</div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-text">Insight AI bulanan</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Gemini menganalisis tanggal, kategori, tipe, dan nominal. Nama, email, catatan, dan ID transaksi tidak dikirim.
              </p>
              {!state.consent?.available ? (
                <p className="mt-3 text-sm font-medium text-amber-700">Gemini belum dikonfigurasi pada server.</p>
              ) : state.consent?.can_manage ? (
                <button onClick={() => setConfirmMode('enable')} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
                  Aktifkan dengan persetujuan
                </button>
              ) : (
                <p className="mt-3 text-xs text-gray-400">Hanya owner kelompok yang dapat mengaktifkan fitur ini.</p>
              )}
            </div>
          </div>
        </section>
        {confirmMode && <ConsentDialog mode={confirmMode} onCancel={() => setConfirmMode(null)} onConfirm={setConsent} />}
      </>
    )
  }

  const content = insightStatus === 'loading' && !insight
    ? <PanelSkeleton compact={compact} />
    : insightStatus === 'failed'
      ? <MessagePanel title="Analisis gagal dimuat" message={state.error} onRetry={() => compact ? dispatch(fetchLatestAIInsight()) : dispatch(fetchMonthlyAIInsight(month))} />
      : insight?.status !== 'completed' || !insight?.analysis
        ? <MessagePanel title={insight?.status === 'failed' ? 'Analisis gagal' : insight?.status === 'processing' ? 'Sedang dianalisis' : 'Belum ada analisis'} message={insight?.status === 'failed' ? 'Backend akan mencoba kembali secara otomatis.' : 'Analisis dibuat setelah bulan berakhir. Halaman ini akan memperbarui hasil otomatis.'} />
        : <InsightContent insight={insight} compact={compact} />

  return (
    <div className="space-y-3">
      {!compact && month && <MonthPicker month={month} onChange={onMonthChange} />}
      {content}
      {!compact && state.consent?.can_manage && (
        <div className="text-center">
          <button onClick={() => setConfirmMode('disable')} className="text-xs font-medium text-gray-400 hover:text-expense">Nonaktifkan Insight AI</button>
        </div>
      )}
      {confirmMode && <ConsentDialog mode={confirmMode} onCancel={() => setConfirmMode(null)} onConfirm={setConsent} />}
    </div>
  )
}

function InsightContent({ insight, compact }) {
  const analysis = insight.analysis
  const style = healthStyle[analysis.health_status] || healthStyle.watch
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl', style.icon)}>✦</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-text">{compact ? 'Insight AI terbaru' : 'Analisis keuangan AI'}</h2>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', style.badge)}>{style.label}</span>
              {insight.is_stale && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Perlu diperbarui</span>}
            </div>
            <p className="mt-0.5 text-xs text-gray-400">Periode {formatMonth(insight.period)}</p>
          </div>
        </div>

        <h3 className="mt-5 text-lg font-bold text-text">{analysis.headline}</h3>
        <p className={cn('mt-2 text-sm leading-6 text-gray-600', compact && 'line-clamp-3')}>{analysis.summary}</p>

        {compact ? (
          <>
            <div className="mt-4 space-y-2">
              {analysis.recommendations?.slice(0, 2).map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex gap-2 text-sm text-gray-600"><span className="text-primary">→</span><span>{item.action}</span></div>
              ))}
            </div>
            <Link to="/reports" className="mt-5 inline-flex text-sm font-semibold text-primary hover:text-primary/80">Lihat analisis lengkap →</Link>
          </>
        ) : (
          <FullInsight insight={insight} />
        )}
      </div>
    </section>
  )
}

function FullInsight({ insight }) {
  const { facts = {}, analysis } = insight
  return (
    <>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Fact label="Pemasukan" value={formatIDR(facts.total_income || 0)} />
        <Fact label="Pengeluaran" value={formatIDR(facts.total_expense || 0)} />
        <Fact label="Saldo bersih" value={formatIDR(facts.net || 0)} />
        <Fact label="Rasio tabungan" value={`${Number(facts.savings_rate_percent || 0).toFixed(1)}%`} />
        <Fact label="Jumlah transaksi" value={String(facts.transaction_count || 0)} />
      </div>
      {!!facts.top_expense_categories?.length && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-text">Kategori pengeluaran terbesar</h4>
          <div className="mt-3 space-y-3">
            {facts.top_expense_categories.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm"><span className="text-gray-600">{item.name}</span><span className="font-medium text-text">{formatIDR(item.amount)}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.share_percent || 0, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <InsightList title="Temuan utama" items={analysis.key_findings} />
      {!!analysis.recommendations?.length && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-text">Rekomendasi</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {analysis.recommendations.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-text">{item.title}</p><Priority value={item.priority} /></div>
                <p className="mt-1.5 text-sm leading-5 text-gray-500">{item.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <InsightList title="Perlu diperhatikan" items={analysis.cautions} warning />
      <div className="mt-6 border-t border-gray-100 pt-4 text-xs leading-5 text-gray-400">
        {insight.generated_at && <p>Dibuat {new Date(insight.generated_at).toLocaleString('id-ID')} · Model {insight.model}</p>}
        <p>Insight AI bersifat informatif dan bukan nasihat finansial profesional. Semua angka dihitung oleh backend, bukan dibuat oleh model AI.</p>
      </div>
    </>
  )
}

function Fact({ label, value }) { return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 font-bold text-text">{value}</p></div> }
function Priority({ value }) { const styles={high:'bg-expense-light text-expense-dark',medium:'bg-amber-100 text-amber-700',low:'bg-income-light text-income-dark'};return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',styles[value]||styles.medium)}>{value||'medium'}</span> }
function InsightList({ title, items = [], warning = false }) { if (!items.length) return null;return <div className="mt-6"><h4 className="text-sm font-semibold text-text">{title}</h4><ul className="mt-2 space-y-2">{items.map((item,index)=><li key={`${item}-${index}`} className="flex gap-2 text-sm leading-5 text-gray-600"><span className={warning?'text-amber-500':'text-primary'}>{warning?'⚠':'•'}</span><span>{item}</span></li>)}</ul></div> }

function MonthPicker({ month, onChange }) {
  const current = parseMonth(month)
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const canNext = current < lastMonth
  return <div className="flex items-center justify-center gap-3"><button onClick={()=>onChange?.(shiftMonth(month,-1))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-500 hover:bg-gray-50">‹</button><span className="min-w-36 text-center text-sm font-semibold text-text">{formatMonth(month)}</span><button disabled={!canNext} onClick={()=>onChange?.(shiftMonth(month,1))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30">›</button></div>
}
function ConsentDialog({ mode, onCancel, onConfirm }) { const enabling=mode==='enable';return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-bold text-text">{enabling?'Aktifkan Insight AI?':'Nonaktifkan Insight AI?'}</h3><p className="mt-3 text-sm leading-6 text-gray-500">{enabling?'Data transaksi tanpa identitas akan dikirim ke Gemini. Pada free tier, Google dapat menggunakan input untuk peningkatan produknya.':'Scheduler berhenti memproses data kelompok dan insight tersimpan tidak akan ditampilkan.'}</p><div className="mt-6 flex justify-end gap-2"><button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50">Batal</button><button onClick={()=>onConfirm(enabling)} className={cn('rounded-lg px-4 py-2 text-sm font-semibold text-white',enabling?'bg-primary':'bg-expense')}>{enabling?'Saya setuju':'Nonaktifkan'}</button></div></div></div> }
function MessagePanel({ title, message, onRetry }) { return <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">✦</div><h3 className="mt-3 font-semibold text-text">{title}</h3><p className="mt-1 text-sm text-gray-500">{message}</p>{onRetry&&<button onClick={onRetry} className="mt-4 text-sm font-semibold text-primary">Coba lagi</button>}</section> }
function PanelSkeleton({ compact }) { return <div className={cn('skeleton w-full rounded-2xl',compact?'h-52':'h-72')} /> }
function parseMonth(value){const [year,month]=value.split('-').map(Number);return new Date(year,month-1,1)}
function shiftMonth(value,amount){const date=parseMonth(value);date.setMonth(date.getMonth()+amount);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
function formatMonth(value){if(!value)return '—';return parseMonth(value).toLocaleDateString('id-ID',{month:'long',year:'numeric'})}
