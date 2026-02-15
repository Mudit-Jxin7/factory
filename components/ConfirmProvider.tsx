'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import ConfirmModal from './ConfirmModal'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}

interface ConfirmProviderProps {
  children: ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    options: ConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  })

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true)
    }
    setModalState({
      isOpen: false,
      options: null,
      resolve: null,
    })
  }

  const handleCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false)
    }
    setModalState({
      isOpen: false,
      options: null,
      resolve: null,
    })
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalState.options && (
        <ConfirmModal
          isOpen={modalState.isOpen}
          title={modalState.options.title}
          message={modalState.options.message}
          confirmText={modalState.options.confirmText}
          cancelText={modalState.options.cancelText}
          type={modalState.options.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  )
}
