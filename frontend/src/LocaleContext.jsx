import { createContext, useContext } from 'react'
import { strings } from './i18n'

export const LocaleContext = createContext('en')

export function useT() {
  const locale = useContext(LocaleContext)
  return (key) => strings[locale]?.[key] ?? strings.en[key] ?? key
}
