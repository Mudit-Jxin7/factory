'use client'

import { ToastProvider } from './ToastProvider'
import { ConfirmProvider } from './ConfirmProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}
