'use client'

import { AdditionalInfo } from '@/lib/types'

interface JobCardAdditionalInfoProps {
  flyWidth: string
  additionalInfo: AdditionalInfo
  isEditMode: boolean
  onFlyWidthChange: (value: string) => void
  onAdditionalInfoChange: (key: keyof AdditionalInfo, value: string) => void
}

const ADDITIONAL_FIELDS: { key: keyof AdditionalInfo; label: string }[] = [
  { key: 'belt', label: 'Belt' }, { key: 'bottom', label: 'Bottom' },
  { key: 'pasting', label: 'Pasting' }, { key: 'bone', label: 'Bone' },
  { key: 'hala', label: 'Hala' }, { key: 'ticketPocket', label: 'Ticket Pocket' },
  { key: 'cutting', label: 'Cutting' }, { key: 'number', label: 'Number' },
  { key: 'buttonTake', label: 'Button Take' }, { key: 'assembly', label: 'Assembly' },
  { key: 'sealStitch', label: 'Seal Stitch' }, { key: 'label', label: 'Label' },
  { key: 'tanki', label: 'Tanki' }, { key: 'kaajButton', label: 'Kaaj + Button' },
  { key: 'finishing', label: 'Finishing' }, { key: 'addition1', label: 'Addition 1' },
  { key: 'addition2', label: 'Addition 2' }, { key: 'addition3', label: 'Addition 3' },
]

const disabledStyle = { background: '#f8f9fa', cursor: 'not-allowed' }

export default function JobCardAdditionalInfo({
  flyWidth, additionalInfo, isEditMode, onFlyWidthChange, onAdditionalInfoChange,
}: JobCardAdditionalInfoProps) {
  return (
    <div className="card">
      <h2>Additional Information</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Fly Width</label>
          <input
            type="text" value={flyWidth}
            onChange={(e) => onFlyWidthChange(e.target.value)}
            disabled={!isEditMode}
            style={!isEditMode ? disabledStyle : {}}
            placeholder="Enter fly width"
          />
        </div>
        {ADDITIONAL_FIELDS.map(({ key, label }) => (
          <div key={key} className="form-group">
            <label>{label}</label>
            <input
              type="text" value={additionalInfo[key]}
              onChange={(e) => onAdditionalInfoChange(key, e.target.value)}
              disabled={!isEditMode}
              style={!isEditMode ? disabledStyle : {}}
              placeholder={label}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
