import { Link } from 'react-router-dom';

const footerLinks = {
  Product: [
    { label: 'Feature', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Review', href: '#testimonials' },
    { label: 'Login', href: '/login' },
  ],
  Company: [
    { label: 'About US', href: '#' },
    { label: 'Careers', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '#' },
    { label: 'Documentation', href: '#' },
  ],
};

export const FooterSection = () => {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="w-full px-[50px] py-20 lg:py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-16 lg:gap-20">
          <div className="lg:col-span-2">
            <Link
              to="/landing-page"
              className="text-3xl lg:text-4xl font-bold text-white hover:text-blue-200 transition-colors inline-block mb-6"
            >
              EventFlow
            </Link>
            <p className="text-slate-300 max-w-md text-lg lg:text-xl leading-relaxed">
              Just thousands of event organizers who trust our platform
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg lg:text-xl mb-6">Product</h4>
            <ul className="space-y-4">
              {footerLinks.Product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-base lg:text-lg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg lg:text-xl mb-6">Company</h4>
            <ul className="space-y-4">
              {footerLinks.Company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-base lg:text-lg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg lg:text-xl mb-6">Support</h4>
            <ul className="space-y-4">
              {footerLinks.Support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-base lg:text-lg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-16 pt-10 text-center text-slate-400 text-base lg:text-lg">
          © {new Date().getFullYear()} EventFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
