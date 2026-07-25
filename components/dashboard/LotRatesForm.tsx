'use client'

import { LotWorkerRates, WorkerProcess } from '@/lib/types'
import { formatIndianAmount } from '@/lib/indianNumberFormat'
import { resolveWorkerProcesses } from '@/lib/workerProcesses'

interface LotRatesFormProps {
  workerRates: LotWorkerRates
  processes?: WorkerProcess[] | null
  isEditMode?: boolean
  onRateChange: (key: string, value: string) => void
}

export default function LotRatesForm({
  workerRates,
  processes,
  isEditMode = true,
  onRateChange,
}: LotRatesFormProps) {
  const fields = resolveWorkerProcesses(processes)

  return (
    <div className="card">
      <h2>Worker Rates</h2>
      <p style={{ margin: '0 0 20px', color: '#6c757d', fontSize: '14px' }}>
        Set rates for the roles you need. Only roles with a rate appear as columns on the job card.
        Add more roles under Developer → Processes.
      </p>
      <div className="form-grid">
        {fields.map((process) => (
          <div key={process.key} className="form-group">
            <label>{process.label} Rate</label>
            {isEditMode ? (
              <input
                type="number"
                value={workerRates[process.key] ?? ''}
                onChange={(e) => onRateChange(process.key, e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            ) : (
              <input
                type="text"
                value={formatIndianAmount(workerRates[process.key], '—')}
                disabled
                style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
