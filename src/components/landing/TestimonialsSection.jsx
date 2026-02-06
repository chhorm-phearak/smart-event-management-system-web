const testimonials = [
  {
    quote:
      '"Smart Event Management transformed how we organize our conferences. The analytics dashboard is incredible and saved us countless hours."',
    name: 'Som Ratanak',
    title: 'Event Director at NTTI',
  },
  {
    quote:
      '"Smart Event Management transformed how we organize our conferences. The analytics dashboard is incredible and saved us countless hours."',
    name: 'You Menglong',
    title: 'Event Director at NTTI',
  },
  {
    quote:
      '"Smart Event Management transformed how we organize our conferences. The analytics dashboard is incredible and saved us countless hours."',
    name: 'Chhorm Phearak',
    title: 'Event Director at NTTI',
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="bg-gray-50 py-24 lg:py-36">
      <div className="w-full px-[50px]">
        <div className="text-center max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6">
            Loved by <span className="text-blue-600">Event Organizers</span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
            See what our customers have to say about their experience with
            EventFlow.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10 lg:gap-12">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-3xl p-10 lg:p-12 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-1.5 mb-8">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-7 h-7 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed mb-8 italic">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 text-lg lg:text-xl">{testimonial.name}</p>
                  <p className="text-base text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
