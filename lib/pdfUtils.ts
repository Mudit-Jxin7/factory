/**
 * PDF export helpers: prepare clone, replace inputs with styled divs, scale fonts.
 * Use only on the cloned node so the live UI is unchanged.
 */
const PDF_FONT_SCALE = 1.4

function parsePx(value: string): number | null {
  if (!value || value === 'normal') return null
  const num = parseFloat(value)
  if (Number.isNaN(num)) return null
  return num
}

/** Set clone dimensions to match source and add class for PDF-specific CSS */
export function prepareCloneForPDF(clone: HTMLElement, sourceRef: HTMLElement): void {
  clone.style.width = `${sourceRef.offsetWidth}px`
  clone.style.maxWidth = `${sourceRef.offsetWidth}px`
  clone.classList.add('pdf-export-clone')
}

/** Replace inputs/textarea/select with divs that have explicit box styling for clean PDF rendering */
export function replaceInputsForPDF(clone: HTMLElement): void {
  const inputs = clone.querySelectorAll('input, textarea, select')
  inputs.forEach((input) => {
    const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const element = input as HTMLElement
    const computedStyle = window.getComputedStyle(element)
    const value = htmlInput.value ?? ''

    const div = document.createElement('div')
    div.setAttribute('data-pdf-input', 'true')
    div.textContent = value

    div.style.display = 'inline-block'
    div.style.width = computedStyle.width
    div.style.minHeight = computedStyle.minHeight || '36px'
    div.style.padding = computedStyle.padding || '10px 12px'
    div.style.border = computedStyle.border || '1px solid #dee2e6'
    div.style.borderRadius = computedStyle.borderRadius || '10px'
    div.style.backgroundColor = computedStyle.backgroundColor || '#ffffff'
    div.style.color = computedStyle.color || '#1a1a1a'
    div.style.fontSize = computedStyle.fontSize
    div.style.fontFamily = computedStyle.fontFamily
    div.style.lineHeight = computedStyle.lineHeight
    div.style.boxSizing = 'border-box'

    const inRatiosGrid = element.closest('.ratios-grid')
    div.style.textAlign = inRatiosGrid ? 'center' : (computedStyle.textAlign || 'left')

    element.parentNode?.replaceChild(div, element)
  })
}

export function scaleCloneFontsForPDF(clone: HTMLElement, factor: number = PDF_FONT_SCALE): void {
  const all = clone.querySelectorAll('*')
  const elements = [clone, ...Array.from(all)]
  elements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const style = window.getComputedStyle(htmlEl)
    const fontSize = style.fontSize
    const lineHeight = style.lineHeight
    const parsedSize = parsePx(fontSize)
    if (parsedSize != null && parsedSize > 0) {
      htmlEl.style.fontSize = `${parsedSize * factor}px`
    }
    const parsedLine = parsePx(lineHeight)
    if (parsedLine != null && parsedLine > 0) {
      htmlEl.style.lineHeight = `${parsedLine * factor}px`
    }
  })
}
