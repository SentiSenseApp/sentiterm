import { useEffect } from 'react'
import { useAppStore } from '../store'

export function useCommandBar() {
  const { commandBarOpen, setCommandBarOpen } = useAppStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandBarOpen(!commandBarOpen)
      }
      if (e.key === 'Escape' && commandBarOpen) {
        setCommandBarOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandBarOpen, setCommandBarOpen])

  return { commandBarOpen, setCommandBarOpen }
}
