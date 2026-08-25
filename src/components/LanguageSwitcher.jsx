import { useLanguage } from '@/context/LanguageContext';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors cursor-pointer"
      aria-label="Select language"
    >
      <option value="en">English</option>
      <option value="km">ខ្មែរ</option>
    </select>
  );
};
