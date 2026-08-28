import { useLanguage } from '@/context/LanguageContext';

const featureIcons = [
  <svg key="global" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="ticket" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>,
  <svg key="calendar" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  <svg key="attendees" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>,
  <svg key="groups" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>,
  <svg key="shield" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>,
];

export const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: featureIcons[0],
      title: t('landing.features.items.0.title'),
      description: t('landing.features.items.0.description'),
    },
    {
      icon: featureIcons[1],
      title: t('landing.features.items.1.title'),
      description: t('landing.features.items.1.description'),
    },
    {
      icon: featureIcons[2],
      title: t('landing.features.items.2.title'),
      description: t('landing.features.items.2.description'),
    },
    {
      icon: featureIcons[3],
      title: t('landing.features.items.3.title'),
      description: t('landing.features.items.3.description'),
    },
    {
      icon: featureIcons[4],
      title: t('landing.features.items.4.title'),
      description: t('landing.features.items.4.description'),
    },
    {
      icon: featureIcons[5],
      title: t('landing.features.items.5.title'),
      description: t('landing.features.items.5.description'),
    },
  ];

  return (
    <section id="features" className="bg-gray-50 py-24 lg:py-36">
      <div className="w-full px-[50px]">
        <div className="text-center max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6">
            {t('landing.features.title', { highlight: '' })}
            <span className="text-blue-600">{t('landing.features.titleHighlight')}</span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
            {t('landing.features.subtitle')}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-3xl p-10 lg:p-12 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-blue-600 text-white rounded-2xl mb-8">
                {feature.icon}
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
