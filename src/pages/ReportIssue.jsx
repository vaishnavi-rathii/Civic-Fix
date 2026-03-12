import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin, X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/helpers';

const STEPS = ['Category', 'Details', 'Location', 'Review'];

export default function ReportIssue() {
  const { reportIssue, user } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    photo: null,
    photoPreview: null,
    location: { lat: 28.6139, lng: 77.2090, address: '' },
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newIssue, setNewIssue] = useState(null);

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update('photoPreview', ev.target.result);
    reader.readAsDataURL(file);
    update('photo', file.name);
  };

  const canProceed = () => {
    if (step === 0) return !!form.category;
    if (step === 1) return form.title.length >= 5 && form.description.length >= 10;
    if (step === 2) return !!form.location.address;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    const issue = reportIssue({
      title: form.title,
      description: form.description,
      category: form.category,
      photo: form.photoPreview,
      location: form.location,
    });
    setNewIssue(issue);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 page-enter">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-navy-900 mb-3">Issue Reported!</h2>
          <p className="text-gray-500 font-body mb-2">Your issue has been submitted successfully.</p>
          <p className="text-sm text-gray-400 font-body mb-8">Authorities have been notified and will review your report.</p>

          <div className="card p-5 text-left mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{CATEGORIES.find(c => c.id === form.category)?.icon}</span>
              <span className="font-display font-bold text-navy-900">{form.title}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={13} />
              <span>{form.location.address}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold">Reported</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-semibold">#{newIssue?.id}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => navigate(`/issue/${newIssue?.id}`)}
              className="btn-primary text-sm">Track This Issue</button>
            <button onClick={() => navigate('/feed')}
              className="btn-secondary text-sm">Back to Feed</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-3xl text-navy-900 mb-1">Report an Issue</h1>
          <p className="text-gray-500 font-body text-sm">Help improve your community by reporting civic problems</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold border-2 transition-all duration-300
                  ${i < step ? 'bg-green-500 border-green-500 text-white'
                  : i === step ? 'bg-flame-500 border-flame-500 text-white shadow-lg shadow-flame-500/30'
                  : 'bg-white border-gray-200 text-gray-400'}`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-display font-semibold ${i === step ? 'text-flame-500' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-300 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card p-6 md:p-8 mb-6 animate-fade-in">
          {/* Step 0: Category */}
          {step === 0 && (
            <div>
              <h2 className="font-display font-bold text-xl text-navy-900 mb-1">What type of issue is it?</h2>
              <p className="text-sm text-gray-500 mb-6">Select the category that best describes the problem</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => update('category', cat.id)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 hover:-translate-y-0.5
                      ${form.category === cat.id ? 'border-current shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    style={form.category === cat.id ? { borderColor: cat.color, backgroundColor: cat.bg } : {}}>
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="text-xs font-display font-semibold" style={form.category === cat.id ? { color: cat.color } : { color: '#374151' }}>
                      {cat.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-xl text-navy-900 mb-1">Describe the issue</h2>
                <p className="text-sm text-gray-500 mb-6">Give authorities enough information to act quickly</p>
              </div>

              <div>
                <label className="label">Issue Title *</label>
                <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                  className="input-field" placeholder="e.g. Large pothole near metro station" maxLength={80} />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/80</p>
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  className="input-field resize-none h-28" placeholder="Describe the problem in detail. Include any safety concerns or how long this issue has been present." maxLength={500} />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
              </div>

              <div>
                <label className="label">Photo (optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-flame-400 hover:bg-flame-500/5
                    ${form.photoPreview ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                  {form.photoPreview ? (
                    <div className="relative">
                      <img src={form.photoPreview} alt="Preview" className="max-h-40 rounded-xl mx-auto object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); update('photo', null); update('photoPreview', null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <X size={12} />
                      </button>
                      <p className="text-xs text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                        <CheckCircle size={12} /> Photo attached
                      </p>
                    </div>
                  ) : (
                    <>
                      <Camera size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-display font-semibold text-gray-500">Click to upload photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF up to 10MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-xl text-navy-900 mb-1">Where is the issue?</h2>
                <p className="text-sm text-gray-500 mb-6">Provide an address or pick a location on the map</p>
              </div>

              <div>
                <label className="label">Address / Landmark *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.location.address}
                    onChange={e => update('location', { ...form.location, address: e.target.value })}
                    className="input-field pl-10" placeholder="e.g. Near Connaught Place Metro, New Delhi" />
                </div>
              </div>

              {/* Map placeholder */}
              <div className="rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 h-56 relative flex items-center justify-center">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(#e5e7eb 1px, transparent 1px),
                    linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
                  backgroundSize: '40px 40px',
                  backgroundColor: '#f9fafb'
                }} />
                <div className="relative text-center z-10 bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200">
                  <MapPin size={32} className="mx-auto text-flame-500 mb-2" />
                  <p className="font-display font-semibold text-sm text-navy-900">Map Integration</p>
                  <p className="text-xs text-gray-400 mt-1">Add Google Maps API key to enable</p>
                  <div className="mt-3 flex gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-flame-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-flame-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-flame-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>

              {/* Quick location presets */}
              <div>
                <p className="text-xs font-display font-semibold text-gray-500 mb-2">Quick select location</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'MG Road, New Delhi',
                    'Connaught Place, Delhi',
                    'Karol Bagh, Delhi',
                    'Lodi Garden, Delhi',
                  ].map(addr => (
                    <button key={addr} onClick={() => update('location', { lat: 28.6139, lng: 77.2090, address: addr })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all
                        ${form.location.address === addr ? 'bg-flame-500 text-white border-flame-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {addr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-bold text-xl text-navy-900 mb-1">Review your report</h2>
              <p className="text-sm text-gray-500 mb-6">Make sure everything looks correct before submitting</p>

              <div className="space-y-4">
                {/* Photo */}
                {form.photoPreview && (
                  <img src={form.photoPreview} alt="Issue" className="w-full max-h-48 object-cover rounded-2xl border border-gray-100" />
                )}

                {/* Details */}
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORIES.find(c => c.id === form.category)?.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 font-body">Category</p>
                      <p className="font-display font-semibold text-navy-900">{CATEGORIES.find(c => c.id === form.category)?.label}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-body mb-0.5">Title</p>
                    <p className="font-display font-semibold text-navy-900">{form.title}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-body mb-0.5">Description</p>
                    <p className="text-sm text-gray-600 font-body leading-relaxed">{form.description}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex items-start gap-2">
                    <MapPin size={14} className="text-flame-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-body mb-0.5">Location</p>
                      <p className="text-sm text-gray-600 font-body">{form.location.address}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-navy-900 text-white text-xs font-display font-bold flex items-center justify-center flex-shrink-0">
                      {user?.avatar}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-body">Reported by</p>
                      <p className="text-sm font-display font-semibold text-navy-900">{user?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-body leading-relaxed">
                    Once submitted, your report will be publicly visible. Please ensure the information is accurate.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="btn-secondary flex-1 text-sm">
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className={`flex-1 text-sm font-display font-semibold px-6 py-3 rounded-xl transition-all duration-200
                ${canProceed()
                  ? 'bg-flame-500 text-white shadow-lg shadow-flame-500/25 hover:bg-flame-600 hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 text-sm font-display font-bold px-6 py-3 rounded-xl bg-green-500 text-white shadow-lg shadow-green-500/25 hover:bg-green-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
              ) : '🚨 Submit Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
