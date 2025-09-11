import React, { createContext, useContext, ReactNode } from 'react'
import { useDiff, UseDiffReturn } from '../hooks/useDiff'

interface DiffProviderProps {
  children: ReactNode
}

const DiffContext = createContext<UseDiffReturn | undefined>(undefined)

export const DiffProvider: React.FC<DiffProviderProps> = ({ children }) => {
  const diffState = useDiff()
  
  return (
    <DiffContext.Provider value={diffState}>
      {children}
    </DiffContext.Provider>
  )
}

export const useDiffContext = (): UseDiffReturn => {
  const context = useContext(DiffContext)
  if (context === undefined) {
    throw new Error('useDiffContext must be used within a DiffProvider')
  }
  return context
}