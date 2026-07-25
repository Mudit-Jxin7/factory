'use client'

import { useMemo } from 'react'
import { IconRuler, IconFile, IconChart, IconCalc } from '../Icons'
import { aggregatePiecesByColor } from '@/lib/colorPieces'
import ColorPiecesTable from '../dashboard/ColorPiecesTable'

interface LotSummarySectionProps {
  lot: any
}

export default function LotSummarySection({ lot }: LotSummarySectionProps) {
  const productionData = lot.productionData || []
  const totalTukda = productionData.reduce((sum: number, row: any) => sum + (Number(row.tukda) || 0), 0)
  const tukdaCount = totalTukda || Number(lot.tukda?.count || 0)
  const grandTotal = Number(
    lot.totalPiecesWithTukda ?? (Number(lot.totalPieces || 0) + tukdaCount)
  ).toFixed(2)
  const colorRows = useMemo(
    () => aggregatePiecesByColor(lot.productionData || []),
    [lot.productionData]
  )

  const summaryCards = [
    { icon: <IconRuler size={20} />, label: 'Total Meter', value: Number(lot.totalMeter || 0).toFixed(2) },
    { icon: <IconFile size={20} />, label: 'Total Pieces', value: Number(lot.totalPieces || 0).toFixed(2) },
    { icon: <IconChart size={20} />, label: 'Grand Total Pieces', value: grandTotal },
    { icon: <IconCalc size={20} />, label: 'Average', value: Number(lot.average || 0).toFixed(4), extra: 'average-value' },
  ]

  return (
    <div className="card">
      <h2>Summary & Calculations</h2>
      <div className="summary-grid">
        <div className="info-item">
          <label># Tukda</label>
          <div className="info-value">{tukdaCount}</div>
        </div>
        <div className="info-item">
          <label>Tukda Size</label>
          <div className="info-value">{lot.tukda?.size || 'N/A'}</div>
        </div>
        {summaryCards.map(({ icon, label, value, extra }) => (
          <div key={label} className="summary-card">
            <div className="summary-icon">{icon}</div>
            <div className="summary-content">
              <div className="summary-label">{label}</div>
              <div className={`summary-value ${extra || ''}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>
      <ColorPiecesTable rows={colorRows} />
    </div>
  )
}
