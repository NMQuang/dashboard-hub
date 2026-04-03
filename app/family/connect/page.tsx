import type { Metadata } from 'next'
import { getRecentCheckIns } from '@/services/family-storage'
import ConnectClient from '@/components/family/ConnectClient'

export const metadata: Metadata = { title: 'Connect · Family' }

export default async function ConnectPage() {
  const checkins = await getRecentCheckIns(30)
  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>family / connect</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>
          Connect <span style={{ fontWeight: 300, color: 'var(--ink2)' }}>daily check-in 💬</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 6 }}>
          Ghi vài dòng mỗi ngày — từ Nhật hay ở nhà. Cả hai cùng thấy.
        </p>
      </div>
      <ConnectClient initialCheckins={checkins} />
    </div>
  )
}
