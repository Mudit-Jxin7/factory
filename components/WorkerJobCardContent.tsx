'use client'

import JobCardContent from './JobCardContent'

interface WorkerJobCardContentProps {
  lotNumber: string
  isEdit?: boolean
}

export default function WorkerJobCardContent({ lotNumber, isEdit }: WorkerJobCardContentProps) {
  return <JobCardContent lotNumber={lotNumber} isEdit={isEdit} variant="worker" />
}
