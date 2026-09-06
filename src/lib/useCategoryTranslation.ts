import { useTranslation } from 'react-i18next';

/**
 * Hook to translate category names dynamically.
 * If a translated label exists in the current locale (under "categories"),
 * it returns the translated name. Otherwise, it returns the original name.
 */
export function useCategoryTranslation() {
  const { t } = useTranslation();
  const translate = (category: string): string => {
    if (!category) return '';
    return t(`categories.${category}`, { defaultValue: category });
  };
  return Object.assign(translate, {
    translateCategory: translate,
    tCategory: translate,
  });
}
