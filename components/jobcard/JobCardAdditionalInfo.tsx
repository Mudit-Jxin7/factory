'use client'

import { AdditionalInfo } from '@/lib/types'
import { ADDITIONAL_INFO_FIELDS } from '@/lib/additionalInfoExport'

interface JobCardAdditionalInfoProps {
  additionalInfo: AdditionalInfo
  isEditMode: boolean
  onAdditionalInfoChange: (key: keyof AdditionalInfo, value: string) => void
}

const disabledStyle = { background: 'var(--color-surface-muted, #f8f9fa)', cursor: 'not-allowed' }

export default function JobCardAdditionalInfo({
  additionalInfo, isEditMode, onAdditionalInfoChange,
}: JobCardAdditionalInfoProps) {
  return (
    <div className="card">
      <h2>Additional Information</h2>
      <div className="form-grid">
        {ADDITIONAL_INFO_FIELDS.map(({ key, label }) => (
          <div key={key} className="form-group">
            <label>{label}</label>
            <input
              type="text"
              value={additionalInfo[key]}
              onChange={(e) => onAdditionalInfoChange(key, e.target.value)}
              disabled={!isEditMode}
              style={!isEditMode ? disabledStyle : {}}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
