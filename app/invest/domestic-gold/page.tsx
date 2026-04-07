// app/invest/domestic-gold/page.tsx
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { fetchVNGold } from '@/services/market'
import { fetchGoldNews } from '@/services/goldNews'
import { GOLD_HOLDINGS, calcGoldPortfolio, goldTypeLabel } from '@/lib/familyGold'
import type { VNGoldPrice, GoldNewsItem, GoldPortfolioSummary } from '@/types'

export const metadata: Metadata = { title: 'VN Domestic Gold' }
export const revalidate = 1800

// ── Fallback shapes ──────────────────────────────────────────────────────────
const EMPTY_PORTFOLIO: GoldPortfolioSummary = {
  totalQuantity: 0,
  totalCostVND: 0,
  totalCurrentVND: 0,
  totalPnlVND: 0,
  totalPnlPct: 0,
  updatedAt: new Date().toISOString(),
}

// ── Data fetching ────────────────────────────────────────────────────────────
async function getPageData(): Promise<{
  vnGold: VNGoldPrice[]
  news: GoldNewsItem[]
}> {
  const [goldResult, newsResult] = await Promise.allSettled([
    fetchVNGold(),
    fetchGoldNews(),
  ])

  return {
    vnGold: goldResult.status === 'fulfilled' ? goldResult.value : [],
    news: newsResult.status === 'fulfilled' ? newsResult.value : [],
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtVnd(value: number): string {
  if (value <= 0) return '—'
  return value.toLocaleString('vi-VN') + ' ₫'
}

function fmtPnl(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '+' : '-'
  return `${prefix}${abs.toLocaleString('vi-VN')} ₫`
}

function fmtRelativeDate(iso: string): string {
  try {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffH < 1) return 'vừa xong'
    if (diffH < 24) return `${diffH}h trước`
    const diffD = Math.floor(diffH / 24)
    return `${diffD}d trước`
  } catch {
    return ''
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function DomesticGoldPage() {
  const { vnGold, news } = await getPageData()
  const portfolio = GOLD_HOLDINGS.length > 0
    ? calcGoldPortfolio(GOLD_HOLDINGS, vnGold)
    : EMPTY_PORTFOLIO

  const isPnlUp = portfolio.totalPnlVND >= 0
  const hasHoldings = GOLD_HOLDINGS.length > 0

  return (
    <div className="page-content" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
          invest / domestic-gold
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', margin: 0 }}>
            Vàng trong nước{' '}
            <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>Giá · Portfolio · Tin tức</span>
          </h1>
          <a
            href="/invest/market"
            style={{ fontSize: 11, color: 'var(--ink3)', textDecoration: 'none' }}
          >
            ← Market
          </a>
        </div>
      </div>

      {/* ── Section 1: Domestic Gold Prices ─────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle>Giá vàng trong nước</CardTitle>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
            VND / lượng (37.5g) · Nguồn: BTMC
          </span>
        </CardHeader>

        {vnGold.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Không lấy được dữ liệu giá — thử lại sau
            </div>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 130px 130px',
              gap: '0 12px',
              padding: '6px 0 8px',
              borderBottom: '1px solid var(--border)',
            }}>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Loại vàng
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>
                Mua vào
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>
                Bán ra
              </span>
            </div>

            {vnGold.map((g) => {
              const isUp = g.change24h > 0
              const hasChange = g.change24h !== 0
              return (
                <div key={g.key} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 130px 130px',
                  gap: '0 12px',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                        {g.brand}
                      </span>
                      {hasChange && (
                        <span className="font-mono" style={{
                          fontSize: 10, fontWeight: 600,
                          padding: '1px 6px', borderRadius: 4,
                          color: isUp ? 'var(--green)' : 'var(--red)',
                          background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                        }}>
                          {isUp ? '+' : ''}{g.change24h.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <span className="font-mono" style={{
                      fontSize: 10.5, color: 'var(--ink3)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360,
                    }}>
                      {g.sourceName}
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink2)', textAlign: 'right' }}>
                    {fmtVnd(g.buy)}
                  </span>
                  <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', textAlign: 'right' }}>
                    {fmtVnd(g.sell)}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </Card>

      {/* ── Section 2: Family Portfolio ───────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle>Portfolio gia đình</CardTitle>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
            Định giá theo giá mua vào (thanh lý)
          </span>
        </CardHeader>

        {!hasHoldings ? (
          <div style={{ padding: '20px 0' }}>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 8 }}>
              Chưa có dữ liệu holdings
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink3)', lineHeight: 1.7 }}>
              Thêm dữ liệu vào{' '}
              <span className="font-mono" style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                lib/familyGold.ts
              </span>{' '}
              → mảng <span className="font-mono" style={{ fontSize: 11 }}>GOLD_HOLDINGS</span>
            </div>
          </div>
        ) : (
          <>
            {/* Holdings table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 60px 130px 130px 90px',
              gap: '0 10px',
              padding: '6px 0 8px',
              borderBottom: '1px solid var(--border)',
            }}>
              {['Ngày mua', 'Loại', 'Qty', 'Giá mua', 'Giá hiện tại', 'PnL'].map((h) => (
                <span key={h} className="font-mono" style={{
                  fontSize: 10, color: 'var(--ink3)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  textAlign: h === 'Qty' || h === 'Giá mua' || h === 'Giá hiện tại' || h === 'PnL' ? 'right' : 'left',
                }}>
                  {h}
                </span>
              ))}
            </div>

            {GOLD_HOLDINGS.map((h) => {
              const matched = vnGold.find((p) => p.key === h.type)
              const currentUnit = matched && matched.buy > 0 ? matched.buy : h.buyPrice
              const pnlUnit = currentUnit - h.buyPrice
              const pnlTotal = pnlUnit * h.quantity
              const isUp = pnlUnit >= 0

              return (
                <div key={h.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 60px 130px 130px 90px',
                  gap: '0 10px',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    {h.purchasedAt}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>
                      {goldTypeLabel(h.type)}
                    </div>
                    {h.note && (
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
                        {h.note}
                      </div>
                    )}
                  </div>
                  <span className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink)', textAlign: 'right' }}>
                    {h.quantity}L
                  </span>
                  <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink2)', textAlign: 'right' }}>
                    {fmtVnd(h.buyPrice)}
                  </span>
                  <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink)', textAlign: 'right' }}>
                    {fmtVnd(currentUnit)}
                  </span>
                  <span className="font-mono" style={{
                    fontSize: 11, textAlign: 'right',
                    color: isUp ? 'var(--green)' : 'var(--red)',
                  }}>
                    {fmtPnl(pnlTotal)}
                  </span>
                </div>
              )
            })}

            {/* Summary row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0 20px',
              padding: '14px 0 4px',
              marginTop: 4,
            }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    Tổng lượng
                  </div>
                  <div className="font-mono" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                    {portfolio.totalQuantity}L
                  </div>
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    Tổng vốn
                  </div>
                  <div className="font-mono" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                    {fmtVnd(portfolio.totalCostVND)}
                  </div>
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    Giá trị hiện tại
                  </div>
                  <div className="font-mono" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                    {fmtVnd(portfolio.totalCurrentVND)}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                  Lãi / Lỗ
                </div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 500, color: isPnlUp ? 'var(--green)' : 'var(--red)' }}>
                  {fmtPnl(portfolio.totalPnlVND)}
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: isPnlUp ? 'var(--green)' : 'var(--red)' }}>
                  {isPnlUp ? '+' : ''}{portfolio.totalPnlPct.toFixed(2)}%
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Section 3: Gold News ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Tin tức vàng hôm nay</CardTitle>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)' }}>
            VnExpress · cập nhật mỗi 30 phút
          </span>
        </CardHeader>

        {news.length === 0 ? (
          <div style={{ padding: '16px 0' }}>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>
              Không tải được tin tức — thử lại sau
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {news.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 0',
                borderBottom: idx < news.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', flexShrink: 0, paddingTop: 2 }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13.5,
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      lineHeight: 1.5,
                      display: 'block',
                    }}
                  >
                    {item.title}
                  </a>
                  <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink3)', marginTop: 3 }}>
                    {item.source} · {fmtRelativeDate(item.publishedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
