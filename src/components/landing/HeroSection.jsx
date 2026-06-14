import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import demoVideo from '@/assets/video/demo01.mp4';

export const HeroSection = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const TARGET_RATE = 0.75;
    const applyRate = () => {
      if (video.playbackRate !== TARGET_RATE) {
        video.playbackRate = TARGET_RATE;
      }
    };

    applyRate();
    video.addEventListener('loadedmetadata', applyRate);
    video.addEventListener('play', applyRate);
    video.addEventListener('ratechange', applyRate);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          applyRate();
          video.play().then(applyRate).catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.removeEventListener('loadedmetadata', applyRate);
      video.removeEventListener('play', applyRate);
      video.removeEventListener('ratechange', applyRate);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="w-full px-[50px] py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-50 rounded-full text-base font-medium text-blue-700 mb-8">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Trusted by 50,000+ event organizers
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 leading-tight mb-8">
              Create{' '}
              <span className="text-blue-600">Amazing</span>{' '}
              <span className="text-blue-600">Events</span>{' '}
              That People Love
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl leading-relaxed">
              The all-in-one platform to create, manage, and promote your events.
              From intimate gatherings to large conferences, we&apos;ve got you covered.
            </p>
            <div className="flex flex-wrap gap-5 mb-12">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 text-lg bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                Start Creating Events
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-lg border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Watch Demo
              </button>
            </div>
            <div className="flex gap-12 text-gray-500">
              <div className="flex items-center gap-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-lg font-medium">50,000+ organizers</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg font-medium">1M+ events created</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="w-full max-w-4xl xl:max-w-5xl aspect-video rounded-3xl bg-black border border-gray-200/50 overflow-hidden shadow-xl">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                src={demoVideo}
                controls
                muted
                playsInline
                loop
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
