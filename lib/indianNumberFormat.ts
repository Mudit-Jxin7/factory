/** Indian accounting format: 1,23,456.78 (lakhs/crores grouping). */
export const formatIndianAmount = (
  value: string | number | null | undefined,
  empty = '',
): string => {
  if (value === null || value === undefined || value === '') return empty
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(num)) return empty
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
