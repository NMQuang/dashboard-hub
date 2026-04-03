import { getBudgetEntries } from '@/services/family-storage'
import { fetchForex } from '@/services/market'

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatMonthKey(date: Date) {
  return date.toISOString().slice(0, 7)
}

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export default async function FamilyFinancePage() {
  const now = new Date()
  const thisMonth = formatMonthKey(startOfMonth(now))
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = formatMonthKey(lastMonthDate)

  const [entriesResult, lastMonthEntriesResult, forexResult] = await Promise.allSettled([
    getBudgetEntries(thisMonth),
    getBudgetEntries(lastMonth),
    fetchForex(),
  ])

  const thisMonthEntries =
    entriesResult.status === 'fulfilled' ? entriesResult.value : []

  const lastMonthEntries =
    lastMonthEntriesResult.status === 'fulfilled' ? lastMonthEntriesResult.value : []

  const forex =
    forexResult.status === 'fulfilled' ? forexResult.value : []

  const jpyRate =
    forex.find((item) => item.symbol === 'JPY')?.price ?? 0

  const income = thisMonthEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)

  const expense = thisMonthEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)

  const balance = income - expense

  const lastMonthIncome = lastMonthEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)

  const lastMonthExpense = lastMonthEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)

  const lastMonthBalance = lastMonthIncome - lastMonthExpense
  const diff = balance - lastMonthBalance

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 8 }}>
          family / finance
        </div>
        <h1 style={{ fontSize: 28, margin: 0 }}>Finance</h1>
        <p style={{ color: 'var(--ink3)', marginTop: 8 }}>
          Theo dõi thu chi gia đình và tỷ giá tham chiếu.
        </p>
      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 20,
            padding: 20,
            background: 'var(--panel)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>
            Thu tháng này
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{formatVND(income)}</div>
        </div>

        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 20,
            padding: 20,
            background: 'var(--panel)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>
            Chi tháng này
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{formatVND(expense)}</div>
        </div>

        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 20,
            padding: 20,
            background: 'var(--panel)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>
            Cân đối
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{formatVND(balance)}</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 8 }}>
            So với tháng trước: {diff >= 0 ? '+' : ''}
            {formatVND(diff)}
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 20,
            padding: 20,
            background: 'var(--panel)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>
            Tỷ giá USD/JPY
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            ¥{Number.isFinite(jpyRate) ? jpyRate.toFixed(2) : '--'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 8 }}>
            /USD • live
          </div>
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--line)',
          borderRadius: 20,
          background: 'var(--panel)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: '1px solid var(--line)',
            fontWeight: 700,
          }}
        >
          Giao dịch tháng này
        </div>

        {thisMonthEntries.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--ink3)' }}>
            Chưa có giao dịch nào trong tháng này.
          </div>
        ) : (
          <div style={{ display: 'grid' }}>
            {thisMonthEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: 16,
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{entry.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>
                    {entry.category} • {entry.date}
                  </div>
                  {entry.note ? (
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 6 }}>
                      {entry.note}
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color: entry.type === 'income' ? '#11845b' : 'inherit',
                    alignSelf: 'center',
                  }}
                >
                  {entry.type === 'income' ? '+' : '-'}
                  {formatVND(entry.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}