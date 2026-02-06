import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for small events and getting started',
    features: [
      'Up to 100 attendees',
      'Basic event pages',
      'Email support',
      'Standard check-in',
      'Basic analytics',
    ],
    cta: 'Get Started',
    ctaLink: '/register',
    highlighted: false,
    variant: 'outline',
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    description: 'Ideal for growing businesses and regular events',
    features: [
      'Up to 1,000 attendees',
      'Custom branding',
      'Priority support',
      'Advanced check-in',
      'Detailed analytics',
      'Marketing tools',
      'Mobile app access',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/register',
    highlighted: true,
    variant: 'solid',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited attendees',
      'White-label solution',
      'Dedicated support',
      'API access',
      'Custom integrations',
      'Advanced security',
      'Training & onboarding',
    ],
    cta: 'Contact Sales',
    ctaLink: '/register',
    highlighted: false,
    variant: 'outline',
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="bg-gray-50 py-24 lg:py-36">
      <div className="w-full px-[50px]">
        <div className="text-center max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6">
            Choose Your <span className="text-blue-600">Perfect</span> Plan
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
            Start free and scale as you grow. All plans include our core
            features with no hidden fees.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10 lg:gap-12 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-white rounded-3xl p-10 lg:p-12 shadow-sm border transition-all ${
                plan.highlighted
                  ? 'border-blue-500 shadow-lg shadow-blue-100 scale-105 z-10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-base font-semibold rounded-full">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Most Popular
                  </span>
                </div>
              )}
              <div className="pt-4 flex flex-col flex-1 min-h-0">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl lg:text-5xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 font-medium text-lg">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600 text-base lg:text-lg mb-8">{plan.description}</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-gray-600 text-base lg:text-lg">
                      <svg
                        className="w-6 h-6 text-blue-600 shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaLink}
                  className={`block w-full text-center py-4 text-lg font-semibold rounded-xl transition-colors mt-auto shrink-0 ${
                    plan.variant === 'solid'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
