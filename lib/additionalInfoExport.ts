import { AdditionalInfo, DEFAULT_ADDITIONAL_INFO } from './types'

/** Merge stored additionalInfo with legacy top-level flyWidth. */
export const normalizeAdditionalInfo = (
  additionalInfo?: Partial<AdditionalInfo> | null,
  legacyFlyWidth?: string | null,
): AdditionalInfo => {
  const info = { ...DEFAULT_ADDITIONAL_INFO, ...(additionalInfo || {}) }
  if (!String(info.flyWidth || '').trim() && legacyFlyWidth) {
    info.flyWidth = String(legacyFlyWidth)
  }
  return info
}

export const isAdditionalInfoEmpty = (
  additionalInfo?: Partial<AdditionalInfo> | null,
  legacyFlyWidth?: string,
): boolean => {
  const info = normalizeAdditionalInfo(additionalInfo, legacyFlyWidth)
  return Object.values(info).every((value) => !String(value || '').trim())
}

export const ADDITIONAL_INFO_FIELDS: { key: keyof AdditionalInfo; label: string }[] = [
  { key: 'flyWidth', label: 'Fly Width' },
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

export const getAdditionalInfoExportRows = (
  flyWidthOrInfo?: string | Partial<AdditionalInfo>,
  additionalInfo?: Partial<AdditionalInfo>,
): [string, string][] => {
  // Support legacy call shape: getAdditionalInfoExportRows(flyWidth, additionalInfo)
  // and new shape: getAdditionalInfoExportRows(additionalInfo)
  let info: AdditionalInfo
  if (typeof flyWidthOrInfo === 'string' || flyWidthOrInfo === undefined || flyWidthOrInfo === null) {
    info = normalizeAdditionalInfo(additionalInfo, flyWidthOrInfo)
  } else {
    info = normalizeAdditionalInfo(flyWidthOrInfo)
  }

  const rows: [string, string][] = []
  for (const { key, label } of ADDITIONAL_INFO_FIELDS) {
    const value = String(info[key] || '').trim()
    if (value) rows.push([label, value])
  }
  return rows
}

export const buildAdditionalInfoPdfBody = (rows: [string, string][]) => {
  const third = Math.ceil(rows.length / 3)
  const col1 = rows.slice(0, third)
  const col2 = rows.slice(third, third * 2)
  const col3 = rows.slice(third * 2)
  return col1.map((item, i) => [
    item[0], item[1] || '', col2[i]?.[0] ?? '', col2[i]?.[1] ?? '',
    col3[i]?.[0] ?? '', col3[i]?.[1] ?? '',
  ])
}
