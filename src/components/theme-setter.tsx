"use client"

import { useEffect } from "react"

export function ThemeSetter() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    
    const setTheme = () => {
      document.documentElement.classList.toggle("dark", media.matches)
    }
    
    setTheme()
    
    media.addEventListener("change", setTheme)
    return () => media.removeEventListener("change", setTheme)
  }, [])
  
  return null
}