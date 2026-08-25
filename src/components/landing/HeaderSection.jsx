import { Link } from 'react-router-dom';
import Logo from '@/assets/icons/MPR Smart Event.png';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const HeaderSection = () => {
  const { t } = useLanguage();

  const navLinks = [
    { label: t('landing.feature'), href: '#features' },
    { label: t('landing.pricing'), href: '#pricing' },
    { label: t('landing.reviews'), href: '#testimonials' },
    { label: t('landing.login'), href: '/login' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="w-full px-[50px]">
        <div className="flex items-center justify-between h-20 lg:h-24">
          <Link to="/landing-page" className="flex items-center gap-2">
            <img
              src={Logo}
              alt="MPR Smart Event"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className="text-2xl lg:text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              MPR Smart Event
            </span>
          </Link>
          <div className="flex items-center gap-10 lg:gap-12">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base lg:text-lg text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block"
              >
                {link.label}
              </a>
            ))}
            <LanguageSwitcher />
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3.5 text-base lg:text-lg bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
