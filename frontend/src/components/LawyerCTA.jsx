import { useT } from '../LocaleContext'

export default function LawyerCTA() {
  const t = useT()
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('lawyer.title')}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {t('lawyer.desc')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="https://www.lawhelp.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          {t('lawyer.find')}
        </a>
        <a
          href="https://www.dol.gov/agencies/whd/contact/complaints"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
        >
          {t('lawyer.dol')}
        </a>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-600 italic">
        {t('lawyer.disclaimer')}
      </p>
    </div>
  )
}
