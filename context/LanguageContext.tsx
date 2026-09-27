'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'

import { Language, TranslationKey, getTranslation } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: TranslationKey) => key,
})

const STORAGE_KEY = 'chronicle_language'

function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved === 'en' || saved === 'nl') {
      return saved
    }

    const navLang = navigator.language?.toLowerCase() || ''

    if (navLang.startsWith('nl')) {
      return 'nl'
    }
  } catch {
    // Ignore
  }

  return 'nl'
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('nl')
  const [, startTransition] = useTransition()

  useEffect(() => {
    const initialLanguage = getStoredLanguage()

    if (initialLanguage !== 'nl') {
      setLanguageState(initialLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    startTransition(() => {
      setLanguageState(lang)
    })

    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Ignore
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    return getTranslation(language, key, params)
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
