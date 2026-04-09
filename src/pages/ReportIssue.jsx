import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, Camera, CheckCircle, AlertCircle, Sparkles, Loader, Mic, MicOff, Copy, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/helpers';
import client, { askClaude } from '../lib/claude';
import AIBadge from '../components/AIBadge';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STEPS = ['Category', 'Details', 'Location', 'Review'];

const ISSUE_SYSTEM = `You are CivicFix AI, a civic issue analysis assistant for Indian cities (Delhi focus).
Analyse the civic complaint and return ONLY valid JSON, no markdown, no explanation.
Return exactly this structure:
{"category":"POTHOLE|STREETLIGHT|GARBAGE|DRAINAGE|WATER_SUPPLY|SEWAGE|ENCROACHMENT|NOISE|STRAY_ANIMALS|TREE_FALLEN|ROAD_DAMAGE|PUBLIC_PROPERTY|OTHER","severity":1-5,"urgency":"Routine|Urgent|Emergency","department":"department name","resolutionTime":"X–Y working days","formalComplaint":"full formal complaint letter text","evidenceChecklist":["item1","item2","item3"]}`;

const DUP_SYSTEM = `Compare this new civic complaint against existing issues.
Return JSON: {"isDuplicate":true/false,"matchedIssueId":"id or null","similarity":0-100,"reason":"brief explanation"}
Only flag as duplicate if similarity > 75%.`;

const VOICE_SYSTEM = `Clean up this voice transcript of a civic issue report. Remove filler words, fix grammar.
Return ONLY valid JSON: {"title":"concise issue title max 80 chars","description":"clear description 2-3 sentences","category":"pothole|garbage|streetlight|water|drainage|road|park|other"}`;

// Leaflet helper: re-center map when position changes
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

// Draggable marker component
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);
  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend: () => {
          const m = markerRef.current;
          if (m) {
            const { lat, lng } = m.getLatLng();
            onDragEnd(lat, lng);
          }
        },
      }}
    />
  );
}

export default function ReportIssue() {
  const { reportIssue, user, issues: existingIssues } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef();
  const recognitionRef = useRef(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: '', title: '', description: '', photo: null, photoPreview: null,
    location: { lat: 28.6139, lng: 77.2090, address: '' },
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newIssue, setNewIssue] = useState(null);

  // AI Analyse
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Photo Analysis
  const [photoAnalysing, setPhotoAnalysing] = useState(false);
  const [photoAI, setPhotoAI] = useState(null);

  // AI Duplicate Detector (step 3)
  const [dupChecking, setDupChecking] = useState(false);
  const [dupResult, setDupResult] = useState(null);
  const [dupDismissed, setDupDismissed] = useState(false);

  // Category-based Duplicate Modal (on submit)
  const [dupModal, setDupModal] = useState(null);

  // Voice
  const [recording, setRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceDone, setVoiceDone] = useState(false);

  // GPS
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsConfirmed, setGpsConfirmed] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const update = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (key === 'title' || key === 'description') { setAiResult(null); setAiError(''); }
  };

  // Reverse geocode with Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const a = data.address || {};
      const parts = [a.road, a.suburb, a.city || a.town || a.village, a.postcode].filter(Boolean);
      const formatted = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      update('location', { lat, lng, address: formatted });
      setGpsConfirmed(formatted);
    } catch {
      update('location', { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      setGpsConfirmed(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // GPS handler
  const handleGPS = () => {
    setGpsLoading(true);
    setGpsError('');
    setGpsConfirmed('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please enter address manually.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMapReady(true);
        await reverseGeocode(lat, lng);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Location access denied. Please enable location in your browser settings or enter address manually.');
        } else if (err.code === 3) {
          setGpsError('Location taking too long. Try again.');
        } else {
          setGpsError('Could not get your location. Please enter address manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // AI Analyse
  const handleAiAnalyse = async () => {
    setAiLoading(true); setAiResult(null); setAiError('');
    try {
      const text = await askClaude(ISSUE_SYSTEM,
        `Title: ${form.title}\nDescription: ${form.description}\nCategory: ${form.category || 'unknown'}`,
        1200);
      setAiResult(JSON.parse(text));
    } catch {
      setAiError('AI analysis failed. Check your API key or try again.');
    } finally { setAiLoading(false); }
  };

  // Photo Analysis
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      update('photoPreview', dataUrl);
      update('photo', file.name);
      setPhotoAnalysing(true); setPhotoAI(null);
      try {
        const base64 = dataUrl.split(',')[1];
        const mediaType = file.type || 'image/jpeg';
        const resp = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: 'This is a photo submitted for a civic issue report in India. Identify what civic problem is shown, estimate its severity, and write 2-3 sentences describing it for an official complaint. Return ONLY JSON: {"problem":"...","severity":1-5,"description":"...","confidence":0-100}' },
            ],
          }],
        });
        const parsed = JSON.parse(resp.content[0].text);
        setPhotoAI(parsed);
        if (!form.description || form.description.length < 10) {
          update('description', parsed.description);
        }
      } catch { setPhotoAI({ error: true }); }
      finally { setPhotoAnalysing(false); }
    };
    reader.readAsDataURL(file);
  };

  // Voice Reporter
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser. Try Chrome.'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.continuous = false;
    r.interimResults = true;
    r.onstart = () => { setRecording(true); setInterimText(''); setVoiceDone(false); };
    r.onresult = (e) => {
      const interim = Array.from(e.results).map(x => x[0].transcript).join('');
      setInterimText(interim);
    };
    r.onend = async () => {
      setRecording(false);
      const finalText = interimText || '';
      if (!finalText.trim()) return;
      setVoiceLoading(true);
      try {
        const raw = await askClaude(VOICE_SYSTEM, `Voice transcript: "${finalText}"`, 300);
        const parsed = JSON.parse(raw);
        if (parsed.title) update('title', parsed.title);
        if (parsed.description) update('description', parsed.description);
        if (parsed.category) update('category', parsed.category);
        setVoiceDone(true);
      } catch { /* silently fail */ }
      finally { setVoiceLoading(false); setInterimText(''); }
    };
    r.onerror = () => { setRecording(false); };
    recognitionRef.current = r;
    r.start();
  };

  const stopRecording = () => { recognitionRef.current?.stop(); };

  // AI Duplicate Detector on step 3
  useEffect(() => {
    if (step === 3 && !dupResult && !dupChecking && existingIssues.length > 0) {
      setDupChecking(true);
      const issuesList = existingIssues.slice(0, 15).map(i =>
        `ID:${i.id} | ${i.title} | ${i.category} | ${i.status}`).join('\n');
      askClaude(DUP_SYSTEM,
        `New issue: Title="${form.title}", Description="${form.description}", Category="${form.category}"\n\nExisting:\n${issuesList}`,
        200)
        .then(raw => {
          try { setDupResult(JSON.parse(raw)); } catch { /* ignore */ }
        })
        .catch(() => {})
        .finally(() => setDupChecking(false));
    }
  }, [step]);

  const canProceed = () => {
    if (step === 0) return !!form.category;
    if (step === 1) return form.title.length >= 5 && form.description.length >= 10;
    if (step === 2) return !!form.location.address;
    return true;
  };

  // Category-based duplicate check (7 days) — fired on submit
  const checkCategoryDup = () => {
    const cutoff = Date.now() - 7 * 86400000;
    return existingIssues.find(i =>
      i.category === form.category && new Date(i.createdAt).getTime() > cutoff
    ) || null;
  };

  const doSubmit = async () => {
    setDupModal(null);
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
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

  const handleSubmit = async () => {
    if (!dupModal) {
      const dup = checkCategoryDup();
      if (dup) {
        const daysAgo = Math.round((Date.now() - new Date(dup.createdAt)) / 86400000);
        setDupModal({ issue: dup, daysAgo });
        return;
      }
    }
    await doSubmit();
  };

  const severityColor = (s) => s <= 2 ? '#22c55e' : s === 3 ? '#f59e0b' : s === 4 ? '#f97316' : '#ef4444';
  const urgencyStyle = { Routine: 'bg-green-100 text-green-700', Urgent: 'bg-amber-100 text-amber-700', Emergency: 'bg-red-100 text-red-700' };

  const mapLat = form.location.lat || 28.6139;
  const mapLng = form.location.lng || 77.2090;
  const hasCoords = !!(form.location.lat && form.location.lng && gpsConfirmed);

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
            <div className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} /><span>{form.location.address}</span></div>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold">Reported</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-semibold">#{newIssue?.id}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate(`/issue/${newIssue?.id}`)} className="btn-primary text-sm">Track This Issue</button>
            <button onClick={() => navigate('/feed')} className="btn-secondary text-sm">Back to Feed</button>
          </div>
        </div>
      </div>
    );
  }

  const matchedIssue = dupResult?.matchedIssueId ? existingIssues.find(i => i.id === dupResult.matchedIssueId) : null;

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-3xl text-navy-900 mb-1">Report an Issue</h1>
          <p className="text-gray-500 font-body text-sm">Help improve your community by reporting civic problems</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold border-2 transition-all duration-300
                  ${i < step ? 'bg-green-500 border-green-500 text-white' : i === step ? 'bg-flame-500 border-flame-500 text-white shadow-lg shadow-flame-500/30' : 'bg-white border-gray-200 text-gray-400'}`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-display font-semibold ${i === step ? 'text-flame-500' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-300 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

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
                    <div className="text-xs font-display font-semibold" style={form.category === cat.id ? { color: cat.color } : { color: '#374151' }}>{cat.label}</div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Description *</label>
                  <button type="button" onClick={recording ? stopRecording : startRecording}
                    title={recording ? 'Stop recording' : 'Voice input'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all
                      ${recording ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-white text-gray-600 border-gray-200 hover:border-flame-400 hover:text-flame-500'}`}>
                    {recording ? <><MicOff size={13} /> Stop</> : <><Mic size={13} /> Voice Input</>}
                  </button>
                </div>

                {(recording || voiceLoading) && (
                  <div className={`mb-2 rounded-xl px-4 py-3 flex items-center gap-3 ${recording ? 'bg-red-50 border border-red-200' : 'bg-flame-50 border border-flame-200'}`}>
                    {recording ? (
                      <>
                        <div className="flex items-end gap-0.5 h-5">
                          {[3,5,4,6,3,5,4,3].map((h, i) => (
                            <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: `${h * 4}px`, animationDelay: `${i * 80}ms` }} />
                          ))}
                        </div>
                        <span className="text-xs text-red-600 font-display font-semibold">Recording… speak now</span>
                        {interimText && <span className="text-xs text-red-400 italic truncate flex-1">{interimText}</span>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-flame-500">
                        <Loader size={13} className="animate-spin" />
                        <span className="text-xs font-display font-semibold">Processing voice input…</span>
                      </div>
                    )}
                  </div>
                )}

                {voiceDone && !voiceLoading && (
                  <div className="mb-2 flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <CheckCircle size={13} />
                    <span className="text-xs font-display font-semibold">✨ AI processed your voice input</span>
                  </div>
                )}

                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  className="input-field resize-none h-28" maxLength={500}
                  placeholder="Describe the problem in detail. Include safety concerns or how long this has been present." />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
              </div>

              {form.title.length >= 5 && form.description.length >= 10 && (
                <div className="space-y-3">
                  <button type="button" onClick={handleAiAnalyse} disabled={aiLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold text-sm border-2 transition-all
                      ${aiLoading ? 'border-flame-200 bg-flame-50 text-flame-300 cursor-not-allowed' : 'border-flame-500 bg-flame-500/5 text-flame-600 hover:bg-flame-500/10 hover:-translate-y-0.5'}`}>
                    {aiLoading
                      ? <><div className="flex gap-1">{[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div> CivicFix AI is thinking…</>
                      : <><Sparkles size={15} /> ✨ Analyse with AI</>}
                  </button>

                  {aiError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-body">{aiError}</p>
                    </div>
                  )}

                  {aiResult && (
                    <div className="bg-navy-900 border-l-4 border-flame-500 rounded-2xl shadow-lg shadow-flame-500/10 overflow-hidden animate-fade-in">
                      <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
                        <span className="font-display font-bold text-white text-sm">AI Analysis</span>
                        <AIBadge />
                      </div>
                      <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Suggested Category</p>
                            <p className="font-display font-semibold text-sm text-white">{aiResult.category?.replace(/_/g, ' ')}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Severity</p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(n => (
                                  <div key={n} className="w-3 h-3 rounded-sm" style={{ backgroundColor: n <= aiResult.severity ? severityColor(aiResult.severity) : '#374151' }} />
                                ))}
                              </div>
                              <span className="text-xs font-bold" style={{ color: severityColor(aiResult.severity) }}>{aiResult.severity}/5</span>
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Urgency</p>
                            <span className={`text-xs px-2 py-0.5 rounded-lg font-display font-bold ${urgencyStyle[aiResult.urgency] || 'bg-gray-100 text-gray-700'}`}>
                              {aiResult.urgency}
                            </span>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Est. Resolution</p>
                            <p className="font-display font-semibold text-sm text-white">{aiResult.resolutionTime}</p>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Department to Contact</p>
                          <p className="font-display font-semibold text-sm text-flame-400">{aiResult.department}</p>
                        </div>

                        {aiResult.evidenceChecklist?.length > 0 && (
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-2">📸 Suggested Evidence</p>
                            <ul className="space-y-1">
                              {aiResult.evidenceChecklist.map((item, i) => (
                                <li key={i} className="text-xs text-white/70 font-body flex items-start gap-2">
                                  <span className="text-flame-400 mt-0.5">•</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiResult.formalComplaint && (
                          <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider">📄 Ready-to-Use Formal Complaint</p>
                              <button onClick={() => { navigator.clipboard.writeText(aiResult.formalComplaint); setCopiedLetter(true); setTimeout(() => setCopiedLetter(false), 2000); }}
                                className="flex items-center gap-1 text-[10px] font-display font-semibold text-flame-400 hover:text-flame-300 transition-colors">
                                {copiedLetter ? <CheckCircle size={11} /> : <Copy size={11} />}
                                {copiedLetter ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-xs text-white/60 font-body leading-relaxed line-clamp-4">{aiResult.formalComplaint}</p>
                          </div>
                        )}
                      </div>
                      <div className="px-5 pb-3 flex items-center gap-1.5 border-t border-white/10 mt-1">
                        <span className="text-flame-400 text-xs">⚡</span>
                        <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · AI-generated suggestions</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photo upload */}
              <div>
                <label className="label">Photo (optional)</label>
                <div onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-flame-400 hover:bg-flame-500/5
                    ${form.photoPreview ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                  {form.photoPreview ? (
                    <div className="relative">
                      <img src={form.photoPreview} alt="Preview" className="max-h-40 rounded-xl mx-auto object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); update('photo', null); update('photoPreview', null); setPhotoAI(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <X size={12} />
                      </button>
                      {photoAnalysing && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-flame-500">
                          <Loader size={14} className="animate-spin" />
                          <span className="text-xs font-display font-semibold">🔍 Analysing photo…</span>
                        </div>
                      )}
                      {photoAI && !photoAI.error && !photoAnalysing && (
                        <div className="mt-3 text-left bg-navy-900/90 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-display font-bold text-green-400">✓ {photoAI.problem} detected</span>
                            <span className="text-[10px] text-white/50 font-body">AI Confidence: {photoAI.confidence}%</span>
                          </div>
                          <p className="text-xs text-white/70 font-body leading-relaxed">{photoAI.description}</p>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <div key={n} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: n <= photoAI.severity ? severityColor(photoAI.severity) : '#374151' }} />
                              ))}
                            </div>
                            <span className="text-[10px] text-white/50 font-body">Visual Severity</span>
                          </div>
                        </div>
                      )}
                      {!photoAnalysing && !photoAI && (
                        <p className="text-xs text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                          <CheckCircle size={12} /> Photo attached
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Camera size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-display font-semibold text-gray-500">Click to upload photo</p>
                      <p className="text-xs text-gray-400 mt-1">AI will auto-analyse your image · JPG, PNG, GIF up to 10MB</p>
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
                <p className="text-sm text-gray-500 mb-6">Use GPS or type the address manually</p>
              </div>

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleGPS}
                disabled={gpsLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-semibold text-sm border-2 transition-all
                  ${gpsLoading ? 'border-flame-200 bg-flame-50 text-flame-300 cursor-not-allowed' : 'border-flame-500 bg-flame-500/5 text-flame-600 hover:bg-flame-500/10 hover:-translate-y-0.5'}`}>
                {gpsLoading
                  ? <><Loader size={15} className="animate-spin" /> Getting your location…</>
                  : <><Navigation size={15} /> 📍 Use My Location</>}
              </button>

              {gpsError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-body">{gpsError}</p>
                </div>
              )}

              {gpsConfirmed && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                  <MapPin size={13} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 font-body">📍 Location detected: <strong>{gpsConfirmed}</strong></p>
                </div>
              )}

              {/* Address input */}
              <div>
                <label className="label">Address / Landmark *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.location.address}
                    onChange={e => {
                      update('location', { ...form.location, address: e.target.value });
                      if (gpsConfirmed) setGpsConfirmed('');
                    }}
                    className="input-field pl-10"
                    placeholder="e.g. Near Connaught Place Metro, New Delhi"
                  />
                </div>
              </div>

              {/* Leaflet Map */}
              {hasCoords && (
                <div className="rounded-2xl overflow-hidden border-2 border-gray-200" style={{ height: '300px' }}>
                  <MapContainer
                    center={[mapLat, mapLng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapRecenter lat={mapLat} lng={mapLng} />
                    <DraggableMarker
                      position={[mapLat, mapLng]}
                      onDragEnd={async (lat, lng) => {
                        setGpsConfirmed('');
                        await reverseGeocode(lat, lng);
                      }}
                    />
                  </MapContainer>
                </div>
              )}

              {hasCoords && (
                <p className="text-xs text-gray-400 font-body flex items-center gap-1">
                  <MapPin size={11} className="text-flame-500" />
                  Drag the marker to fine-tune the location — address will update automatically.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-bold text-xl text-navy-900 mb-1">Review your report</h2>
              <p className="text-sm text-gray-500 mb-6">Make sure everything looks correct before submitting</p>

              {dupChecking && (
                <div className="mb-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Loader size={13} className="text-gray-400 animate-spin" />
                  <span className="text-xs text-gray-500 font-body">Checking for duplicate reports…</span>
                </div>
              )}
              {dupResult?.isDuplicate && !dupDismissed && (
                <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-display font-bold text-amber-800">⚠️ Similar issue already reported</p>
                      {matchedIssue && (
                        <p className="text-xs text-amber-700 font-body mt-1">
                          "{matchedIssue.title}" — filed {Math.round((Date.now() - new Date(matchedIssue.createdAt)) / 86400000)}d ago, currently <strong>{matchedIssue.status}</strong>
                        </p>
                      )}
                      <p className="text-xs text-amber-600 font-body mt-0.5">{dupResult.reason} · {dupResult.similarity}% match</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {matchedIssue && (
                      <button onClick={() => navigate(`/issue/${matchedIssue.id}`)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 font-display font-semibold hover:bg-amber-200 transition-colors">
                        View Existing
                      </button>
                    )}
                    <button onClick={() => setDupDismissed(true)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-600 border border-gray-300 font-display font-semibold hover:bg-gray-50 transition-colors">
                      Submit Anyway
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {form.photoPreview && <img src={form.photoPreview} alt="Issue" className="w-full max-h-48 object-cover rounded-2xl border border-gray-100" />}
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORIES.find(c => c.id === form.category)?.icon}</span>
                    <div><p className="text-xs text-gray-400 font-body">Category</p><p className="font-display font-semibold text-navy-900">{CATEGORIES.find(c => c.id === form.category)?.label}</p></div>
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
                      {form.location.lat && form.location.lng && (
                        <p className="text-xs text-gray-400 font-body mt-0.5">
                          📍 {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-navy-900 text-white text-xs font-display font-bold flex items-center justify-center flex-shrink-0">{user?.avatar}</div>
                    <div><p className="text-xs text-gray-400 font-body">Reported by</p><p className="text-sm font-display font-semibold text-navy-900">{user?.name}</p></div>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-body leading-relaxed">Once submitted, your report will be publicly visible. Please ensure the information is accurate.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 text-sm">← Back</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className={`flex-1 text-sm font-display font-semibold px-6 py-3 rounded-xl transition-all duration-200
                ${canProceed() ? 'bg-flame-500 text-white shadow-lg shadow-flame-500/25 hover:bg-flame-600 hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || (dupResult?.isDuplicate && !dupDismissed)}
              className="flex-1 text-sm font-display font-bold px-6 py-3 rounded-xl bg-green-500 text-white shadow-lg shadow-green-500/25 hover:bg-green-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</> : '🚨 Submit Report'}
            </button>
          )}
        </div>
      </div>

      {/* Duplicate Category Modal */}
      {dupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-navy-900 mb-2">⚠️ Similar issue already reported</h3>
            <p className="text-sm text-gray-600 font-body mb-1">
              <strong>"{dupModal.issue.title}"</strong> was filed{' '}
              {dupModal.daysAgo === 0 ? 'today' : `${dupModal.daysAgo} day${dupModal.daysAgo === 1 ? '' : 's'} ago`}.
            </p>
            <p className="text-xs text-gray-500 font-body mb-5">
              Status: <span className="font-semibold capitalize">{dupModal.issue.status.replace('-', ' ')}</span> · Category: {CATEGORIES.find(c => c.id === dupModal.issue.category)?.label}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { navigate(`/issue/${dupModal.issue.id}`); setDupModal(null); }}
                className="w-full py-3 rounded-xl bg-navy-900 text-white font-display font-semibold text-sm hover:bg-navy-800 transition-colors">
                View Existing Issue
              </button>
              <button
                onClick={doSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-display font-semibold text-sm hover:bg-gray-50 transition-colors">
                {submitting ? 'Submitting…' : 'Yes, submit anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
