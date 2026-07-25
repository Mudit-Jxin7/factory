import { WorkerProcess } from '@/lib/types'

/** Built-in processes (seeded into Mongo if the collection is empty). */
export const DEFAULT_WORKER_PROCESSES: Omit<WorkerProcess, '_id'>[] = [
  { key: 'front', productionKey: 'front', label: 'Front', roleCode: 'FRONT', sortOrder: 1, active: true },
  { key: 'back', productionKey: 'back', label: 'Back', roleCode: 'BACK', sortOrder: 2, active: true },
  { key: 'zip', productionKey: 'zip', label: 'Zip', roleCode: 'ZIP', sortOrder: 3, active: true },
  { key: 'astar', productionKey: 'astar', label: 'Astar', roleCode: 'ASTAR', sortOrder: 4, active: true },
  { key: 'belt', productionKey: 'beltProd', label: 'Belt', roleCode: 'BELT', sortOrder: 5, active: true },
]

export const slugifyProcessKey = (label: string): string =>
  String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)

export const roleCodeFromLabel = (label: string): string =>
  String(label || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)

export const getProcessProductionKey = (process: Pick<WorkerProcess, 'key' | 'productionKey'>) =>
  process.productionKey || process.key

export const sortWorkerProcesses = <T extends Pick<WorkerProcess, 'sortOrder' | 'label'>>(list: T[]): T[] =>
  [...list].sort((a, b) => (a.sortOrder - b.sortOrder) || a.label.localeCompare(b.label))

export const activeWorkerProcesses = (processes: WorkerProcess[] = []): WorkerProcess[] =>
  sortWorkerProcesses(processes.filter((p) => p.active !== false))

export const allWorkerProcesses = (processes: WorkerProcess[] = []): WorkerProcess[] =>
  sortWorkerProcesses(processes)

/** Active processes for new lots / catalogs. Falls back to seeded defaults. */
export const resolveWorkerProcesses = (processes?: WorkerProcess[] | null): WorkerProcess[] => {
  if (processes && processes.length > 0) return activeWorkerProcesses(processes)
  return activeWorkerProcesses(DEFAULT_WORKER_PROCESSES as WorkerProcess[])
}

/**
 * Processes to show for a lot's rates/job card:
 * all active processes, plus any inactive process that already has a rate on this lot
 * so older lots keep their data after deactivation.
 */
export const resolveWorkerProcessesForLot = (
  processes?: WorkerProcess[] | null,
  rates?: Partial<Record<string, string>> | null,
): WorkerProcess[] => {
  const source = (processes && processes.length > 0)
    ? processes
    : (DEFAULT_WORKER_PROCESSES as WorkerProcess[])
  const active = activeWorkerProcesses(source)
  const activeKeys = new Set(active.map((p) => p.key))
  const retained = sortWorkerProcesses(
    source.filter((p) => {
      if (activeKeys.has(p.key)) return false
      if (p.active !== false) return false
      const value = String(rates?.[p.key] ?? '').trim()
      if (!value) return false
      const num = Number(value)
      return Number.isFinite(num) && num >= 0
    }),
  )
  return sortWorkerProcesses([...active, ...retained])
}
