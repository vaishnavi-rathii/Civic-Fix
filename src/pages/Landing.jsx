import { Link } from 'react-router-dom';
import { MapPin, Camera, Bell, BarChart3, ArrowRight, CheckCircle, ChevronRight } from 'lucide-react';

const STATS = [
  { label: 'Issues Reported', value: '12,400+' },
  { label: 'Resolved', value: '8,900+' },
  { label: 'Active Cities', value: '24' },
  { label: 'Happy Citizens', value: '50K+' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Spot an Issue', desc: 'See a civic problem? Take a photo and note the location.', icon: '📸' },
  { step: '02', title: 'Report It', desc: 'Fill in details, select category, and pin it on the map.', icon: '📍' },
  { step: '03', title: 'We Track It', desc: 'Authorities get notified and update status in real time.', icon: '🔔' },
  { step: '04', title: 'Problem Solved', desc: 'Get notified when your issue is marked resolved!', icon: '✅' },
];

const FEATURES = [
  { icon: <Camera size={22} />, title: 'Photo Evidence', desc: 'Attach images directly from your device for clearer reports.', color: '#ff6b35' },
  { icon: <MapPin size={22} />, title: 'Location Pinning', desc: 'Tag the exact location with our integrated map tool.', color: '#6366f1' },
  { icon: <Bell size={22} />, title: 'Live Notifications', desc: 'Get real-time updates when your issue status changes.', color: '#0ea5e9' },
  { icon: <BarChart3 size={22} />, title: 'Transparent Tracking', desc: 'Follow every step from reported → in-progress → resolved.', color: '#22c55e' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 0), radial-gradient(circle at 75px 75px, white 2px, transparent 0)`,
            backgroundSize: '100px 100px',
          }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-flame-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-body text-white/80">Active in 24 cities across India</span>
            </div>

            <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6">
              Fix Your City,
              <br />
              <span className="text-flame-400">One Report</span>
              <br />
              at a Time.
            </h1>

            <p className="text-lg md:text-xl text-white/70 font-body font-light leading-relaxed mb-10 max-w-xl">
              CivicFix bridges the gap between citizens and local authorities. Report civic issues, track resolutions, and make your neighbourhood better.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 bg-flame-500 text-white font-display font-bold px-8 py-4 rounded-2xl hover:bg-flame-600 transition-all shadow-xl shadow-flame-500/30 hover:-translate-y-1 text-base">
                Start Reporting <ArrowRight size={18} />
              </Link>
              <Link to="/feed"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-display font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/20 text-base">
                View Public Feed
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="font-display font-extrabold text-3xl text-white">{stat.value}</div>
                  <div className="text-sm text-white/50 font-body mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-flame-500 font-display font-bold text-sm uppercase tracking-widest">How it works</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-navy-900 mt-3">Simple as 1-2-3</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative text-center group">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px border-t-2 border-dashed border-gray-200 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-sm group-hover:border-flame-500/30 group-hover:shadow-md transition-all">
                  {step.icon}
                </div>
                <div className="font-display font-extrabold text-xs text-flame-500 tracking-widest mb-2">{step.step}</div>
                <h3 className="font-display font-bold text-lg text-navy-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 font-body leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-flame-500 font-display font-bold text-sm uppercase tracking-widest">Features</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-navy-900 mt-3">Built for Citizens</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(feat => (
              <div key={feat.title} className="card p-6 hover:shadow-md transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: feat.color }}>
                  {feat.icon}
                </div>
                <h3 className="font-display font-bold text-base text-navy-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 font-body leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-6">
            Ready to Make a <span className="text-flame-400">Difference?</span>
          </h2>
          <p className="text-white/60 font-body text-lg mb-10">Join thousands of citizens already improving their communities.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-flame-500 text-white font-display font-bold px-10 py-4 rounded-2xl hover:bg-flame-600 transition-all shadow-xl shadow-flame-500/30 hover:-translate-y-1 text-base">
            Get Started Free <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-white/40 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-flame-500 rounded-md flex items-center justify-center">
              <span className="text-white font-display font-extrabold text-xs">CF</span>
            </div>
            <span className="font-display font-semibold text-sm text-white/60">CivicFix</span>
          </div>
          <p className="text-xs font-body">© 2025 CivicFix. Built for a better India.</p>
        </div>
      </footer>
    </div>
  );
}
