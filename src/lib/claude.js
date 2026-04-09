// ─── CivicFix AI Simulator ───────────────────────────────────────────────────
// Rule-based intelligence — no real API needed, works offline, instant results.

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick  = (arr) => arr[rand(0, arr.length - 1)];

// ─── Feature detection ───────────────────────────────────────────────────────
function detectFeature(sp = '') {
  const s = sp.toLowerCase();
  if (s.includes('formalcomplaint') || (s.includes('civicfix ai') && s.includes('urgency'))) return 'issueAnalyser';
  if (s.includes('civic analytics assistant')) return 'healthScore';
  if (s.includes('civic issue manager') && s.includes('rank')) return 'priorityActions';
  if (s.includes('analyse issue locations') || s.includes('"hotspots"')) return 'hotspots';
  if (s.includes('analyse citizen comments')) return 'sentiment';
  if (s.includes('civic resolution expert')) return 'resolution';
  if (s.includes('drafting formal complaint letters')) return 'letterGen';
  if (s.includes('voice transcript')) return 'voice';
  if (s.includes('civic analyst for delhi localities')) return 'cityPredictor';
  if (s.includes('search assistant for a civic issues platform')) return 'aiSearch';
  if (s.includes('explains civic issue status')) return 'statusNarrator';
  if (s.includes('civicfix assistant')) return 'chatbot';
  if (s.includes('professional translator') && s.includes('hindi')) return 'translator';
  if (s.includes('compare this new civic complaint')) return 'dupDetector';
  return 'generic';
}

// ─── Shared helpers ──────────────────────────────────────────────────────────
const DEPT_MAP = {
  POTHOLE:        'Public Works Department (PWD)',
  ROAD_DAMAGE:    'Public Works Department (PWD)',
  STREETLIGHT:    'Delhi Electricity Supply Co. (BSES/TPDDL)',
  GARBAGE:        'Municipal Corporation of Delhi (MCD)',
  DRAINAGE:       'Delhi Jal Board (DJB)',
  WATER_SUPPLY:   'Delhi Jal Board (DJB)',
  SEWAGE:         'Delhi Jal Board (DJB)',
  ENCROACHMENT:   'MCD Enforcement Wing',
  NOISE:          'Delhi Police / DPCC',
  STRAY_ANIMALS:  'MCD Animal Welfare Wing',
  TREE_FALLEN:    'Forest & Wildlife Department',
  PUBLIC_PROPERTY:'Municipal Corporation of Delhi (MCD)',
  OTHER:          'Municipal Corporation of Delhi (MCD)',
};

const RESOLUTION_MAP = {
  POTHOLE:'3–5 working days', ROAD_DAMAGE:'5–10 working days',
  STREETLIGHT:'2–4 working days', GARBAGE:'1–2 working days',
  DRAINAGE:'5–7 working days', WATER_SUPPLY:'2–3 working days',
  SEWAGE:'3–5 working days', ENCROACHMENT:'7–14 working days',
  NOISE:'1–3 working days', STRAY_ANIMALS:'2–5 working days',
  TREE_FALLEN:'1–2 working days', OTHER:'5–7 working days',
};

const EVIDENCE_MAP = {
  POTHOLE:     ['Photo showing depth with a coin/scale', 'Nearby road signs or landmarks', 'Photo from both directions of traffic'],
  GARBAGE:     ['Photo from multiple angles', 'Nearby shop or building as landmark', 'Photo showing how long waste has accumulated'],
  STREETLIGHT: ['Night photo showing non-functional light', 'Pole number if visible', 'Affected street stretch length'],
  WATER_SUPPLY:['Video of tap showing no/low supply', 'Photo of meter reading', 'Water supply schedule from DJB'],
  DRAINAGE:    ['Photo of blocked drain or overflow', 'Water-logging extent in area', 'Nearby landmarks for location'],
  default:     ['Clear photo of the issue', 'Nearby landmark for location reference', 'Approximate duration of the problem'],
};

function guessCategory(text) {
  const t = text.toLowerCase();
  if (/pothole|crater|hole in road/.test(t))        return 'POTHOLE';
  if (/garbage|trash|waste|dump|littering/.test(t)) return 'GARBAGE';
  if (/streetlight|lamp|dark street|light post/.test(t)) return 'STREETLIGHT';
  if (/water supply|pipe|no water|water pressure/.test(t)) return 'WATER_SUPPLY';
  if (/drain|drainage|sewer|flood|waterlog/.test(t)) return 'DRAINAGE';
  if (/sewage|manhole|overflow sewer/.test(t))      return 'SEWAGE';
  if (/encroach|illegal structure|squatter/.test(t)) return 'ENCROACHMENT';
  if (/noise|sound|loud|blaring|horn/.test(t))      return 'NOISE';
  if (/stray|dog|cat|animal bite/.test(t))          return 'STRAY_ANIMALS';
  if (/tree|branch|fallen tree|uprooted/.test(t))   return 'TREE_FALLEN';
  if (/road damage|pavement|footpath|broken road/.test(t)) return 'ROAD_DAMAGE';
  return 'OTHER';
}

function guessSeverity(text) {
  const t = text.toLowerCase();
  if (/emergency|danger|accident|injury|collapse|flood|bleeding/.test(t)) return 5;
  if (/urgent|serious|major|large|big|severe|hazard/.test(t)) return 4;
  if (/small|minor|little|slight/.test(t)) return 2;
  if (/medium|moderate/.test(t)) return 3;
  return rand(2, 4);
}

// ─── Feature mocks ───────────────────────────────────────────────────────────

function mockIssueAnalyser(msg) {
  const titleM = msg.match(/Title:\s*(.+)/i);
  const descM  = msg.match(/Description:\s*(.+)/i);
  const catM   = msg.match(/Category:\s*(.+)/i);
  const title  = titleM ? titleM[1].trim() : 'Civic issue';
  const desc   = descM  ? descM[1].trim()  : 'Issue requires attention';
  const rawCat = catM   ? catM[1].trim().toUpperCase().replace(/\s+/g,'_') : 'OTHER';
  const combined = `${title} ${desc}`;
  const category = rawCat === 'UNKNOWN' ? guessCategory(combined) : (DEPT_MAP[rawCat] ? rawCat : guessCategory(combined));
  const severity = guessSeverity(combined);
  const urgency  = severity >= 5 ? 'Emergency' : severity >= 4 ? 'Urgent' : 'Routine';
  const dept     = DEPT_MAP[category] || DEPT_MAP.OTHER;
  const res      = RESOLUTION_MAP[category] || '5–7 working days';
  const ref      = `CF-${new Date().getFullYear()}-${rand(10000,99999)}`;
  const today    = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

  return {
    category, severity, urgency, department: dept, resolutionTime: res,
    formalComplaint:
`Ref: ${ref}
Date: ${today}

To,
The ${dept},
Government of NCT of Delhi,
New Delhi

Sub: Complaint Regarding ${title}

Respected Sir/Madam,

I am writing to bring to your urgent attention a civic issue in my locality that requires immediate redressal.

Issue Description:
${desc}

This problem is causing substantial inconvenience and poses a safety risk to residents. I request prompt action as per the Delhi Municipal Corporation Act and relevant civic amenities guidelines.

In the absence of timely resolution within ${res}, I reserve my right to file a complaint under the Right to Information Act, 2005 (Section 6).

Thanking you,
Yours faithfully,
[Your Name & Contact]
Date: ${today}`,
    evidenceChecklist: EVIDENCE_MAP[category] || EVIDENCE_MAP.default,
  };
}

function mockHealthScore(msg) {
  const rrM = msg.match(/ResolutionRate:\s*([\d.]+)/i);
  const rr  = rrM ? parseFloat(rrM[1]) : 50;
  const score = Math.min(100, Math.round(rr * 0.7 + rand(10, 25)));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  return {
    score, label, color,
    narrative: `Delhi's civic health score stands at ${score}/100 — ${label}. The current resolution rate of ${Math.round(rr)}% reflects ${rr >= 70 ? 'commendable' : 'moderate'} departmental efficiency. Key areas for improvement include faster first-response times and reducing the backlog of drainage and road issues.`,
  };
}

function mockPriorityActions(msg) {
  const lines = msg.split('\n').filter(l => l.startsWith('['));
  const ACTIONS = [
    { icon:'🕳️', title:'Resolve pending pothole reports', issueRef:'Multiple pothole complaints in queue', reason:'High accident risk; monsoon season approaching' },
    { icon:'🗑️', title:'Clear garbage backlog in hotspot areas', issueRef:'3+ unresolved garbage complaints', reason:'Public health hazard; breeding ground for disease' },
    { icon:'💡', title:'Repair non-functional streetlights', issueRef:'Streetlight outages reported', reason:'Night-time safety risk for pedestrians and vehicles' },
    { icon:'🌊', title:'Inspect and clear blocked drains', issueRef:'Drainage overflow complaints pending', reason:'Risk of waterlogging before monsoon' },
    { icon:'🔔', title:'Send status updates to long-pending cases', issueRef:'Issues older than 7 days without update', reason:'Citizen trust erodes without communication' },
  ];
  return { actions: ACTIONS.map((a, i) => ({ ...a, rank: i + 1 })) };
}

function mockHotspots(msg) {
  const lines = msg.split('\n').filter(l => l.includes('|'));
  const areas = {};
  lines.forEach(l => {
    const addr = (l.split('|')[0] || '').trim();
    const area = addr.split(',')[0].trim() || 'Central Area';
    if (area) areas[area] = (areas[area] || 0) + 1;
  });
  const sorted = Object.entries(areas).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const fallback = [
    { area:'Dwarka Sector 10–12', issueCount:8, topCategory:'Drainage', description:'Repeated drainage overflow due to ageing pipes; requires urgent PWD inspection.' },
    { area:'Karol Bagh Main Road', issueCount:6, topCategory:'Pothole',  description:'High-traffic corridor with multiple unreported potholes causing vehicle damage.' },
    { area:'Rohini Block C',       issueCount:5, topCategory:'Garbage',  description:'Overflowing garbage bins near market area; daily collection needs to be doubled.' },
  ];
  if (sorted.length < 3) return { hotspots: fallback };
  return {
    hotspots: sorted.map(([area, count], i) => ({
      area, issueCount: count,
      topCategory: pick(['Drainage','Pothole','Garbage','Road Damage','Streetlight']),
      description: `${count} complaints cluster in this zone. Targeted inspection and preventive maintenance recommended.`,
    })),
  };
}

function mockSentiment(msg) {
  const words = msg.toLowerCase();
  const negCount = (words.match(/not resolved|still waiting|no action|useless|pathetic|disgusting|frustrated|angry|worst|terrible|horrible/g) || []).length;
  const posCount = (words.match(/thank|resolved|fixed|great|excellent|good job|helpful|improved/g) || []).length;
  let overall = 'Neutral';
  if (negCount >= 4) overall = 'Angry';
  else if (negCount >= 2) overall = 'Frustrated';
  else if (posCount >= 2) overall = 'Positive';
  const topFrustrated = [
    { complaint: 'The pothole has been there for 3 months and nobody cares.', urgency: 'Vehicle damage and safety risk daily' },
    { complaint: 'Filed complaint twice, zero response from PWD.', urgency: 'Trust deficit; citizen disengagement risk' },
    { complaint: 'Drainage overflows every time it rains. When will it be fixed?', urgency: 'Health hazard; recurring monsoon flooding' },
  ].slice(0, negCount >= 2 ? 3 : 1);
  return {
    overall, topFrustrated,
    responseTemplate: `Dear Citizen, thank you for your patience. We have escalated your complaint (#ID) to the concerned department. A field team has been assigned and will visit within 48 hours. We apologise for the delay and appreciate your civic engagement — CivicFix Admin`,
  };
}

function mockResolution(msg) {
  const catM = msg.match(/Category:\s*(.+)/i);
  const locM = msg.match(/Location:\s*(.+)/i);
  const cat  = catM ? catM[1].trim() : 'Other';
  const loc  = locM ? locM[1].trim() : 'the reported location';
  const PLANS = {
    pothole: ['Mark pothole with safety cones within 24 hrs','Assign PWD crew for cold-mix patching','Conduct road survey within 50m radius','Permanent hot-mix repair within 5 working days','Post-repair inspection and photo documentation'],
    garbage: ['Issue notice to local safai karamchari supervisor','Schedule emergency pick-up within 12 hrs','Identify illegal dumping source','Install CCTV or signage at hotspot','Increase collection frequency to twice daily'],
    drainage: ['Dispatch JCB team for drain de-silting','Clear immediate blockage within 24 hrs','Inspect 200m of drain upstream','Coordinate with DJB for pipe condition check','Schedule monsoon-prep maintenance'],
    default: ['Assign field inspection team within 24 hrs','Document issue with photo evidence','Coordinate with relevant department','Execute repair work within SLA period','Close issue after citizen verification'],
  };
  const key = Object.keys(PLANS).find(k => cat.toLowerCase().includes(k)) || 'default';
  const dept = DEPT_MAP[guessCategory(cat)] || DEPT_MAP.OTHER;
  const budget = { pothole:'₹8,000–₹25,000', garbage:'₹2,000–₹5,000', drainage:'₹15,000–₹60,000', streetlight:'₹5,000–₹18,000', default:'₹5,000–₹30,000' };
  return {
    rootCause: `Based on category and location data, the most likely root cause is aging civic infrastructure at ${loc}, compounded by delayed preventive maintenance cycles.`,
    resolutionPlan: PLANS[key],
    department: dept,
    budgetRange: budget[key] || budget.default,
    citizenResponse: `Dear Citizen, your complaint regarding ${cat} at ${loc} has been acknowledged (Ref: CF-${rand(1000,9999)}). We have assigned the ${dept} to address this. Expected resolution within ${RESOLUTION_MAP[guessCategory(cat)] || '5–7 working days'}. Thank you for helping improve Delhi — CivicFix Admin`,
  };
}

function mockLetterGen(msg) {
  const nameM   = msg.match(/Complainant Name:\s*(.+)/i);
  const addrM   = msg.match(/Address:\s*(.+)/i);
  const wardM   = msg.match(/Ward:\s*(.+)/i);
  const recipM  = msg.match(/Recipient:\s*(.+)/i);
  const issueM  = msg.match(/Issue Description:\s*([\s\S]+?)(?:\nDate:|$)/i);
  const dateM   = msg.match(/Date:\s*(.+)/i);
  const name    = nameM  ? nameM[1].trim()  : '[Your Name]';
  const address = addrM  ? addrM[1].trim()  : '[Your Address]';
  const ward    = wardM  ? wardM[1].trim()  : '[Your Ward]';
  const recip   = recipM ? recipM[1].trim() : 'The Commissioner, Municipal Corporation of Delhi';
  const issue   = issueM ? issueM[1].trim() : '[Issue Description]';
  const date    = dateM  ? dateM[1].trim()  : new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  const ref     = `CF-${new Date().getFullYear()}-${rand(10000,99999)}`;
  return `Ref: ${ref}
Date: ${date}

To,
${recip},
New Delhi

Sub: Formal Complaint Regarding Civic Issue — ${ward}

Respected Sir/Madam,

I, ${name}, a resident of ${address}, ${ward}, would like to draw your kind attention to the following civic issue that has been causing significant inconvenience to the residents of our locality:

Issue:
${issue}

This problem has been persisting for a considerable period and is adversely affecting the daily life, health, and safety of the residents. Despite the issue being visible and reported informally to local officials, no remedial action has been taken so far.

In view of the above, I most respectfully request your good office to:
1. Cause an immediate inspection of the site.
2. Direct the concerned department/agency to undertake necessary remedial work at the earliest.
3. Keep the undersigned informed of the action taken within 15 working days.

I would like to bring to your notice that in case no action is taken within a reasonable period, I shall be constrained to file a complaint under the Right to Information Act, 2005, and escalate the matter to the appropriate authority.

I trust that your office will take cognisance of this complaint and ensure prompt resolution in the larger public interest.

Thanking you,
Yours faithfully,

${name}
${address}
${ward}
Date: ${date}`;
}

function mockVoice(msg) {
  const transcript = msg.replace('Voice transcript:', '').replace(/"/g,'').trim();
  const category = guessCategory(transcript);
  const words    = transcript.split(' ').filter(Boolean);
  const title    = words.slice(0, Math.min(10, words.length)).join(' ').replace(/^[a-z]/, c => c.toUpperCase());
  return {
    title:       title.length > 10 ? title.slice(0, 75) : `Civic issue — ${category.replace(/_/g,' ')}`,
    description: transcript.charAt(0).toUpperCase() + transcript.slice(1),
    category:    category.toLowerCase().replace(/_/g,''),
  };
}

const DELHI_AREAS = {
  dwarka:      { score:62, label:'Fair',      risks:['Drainage overflow in sectors 10–23','Waterlogging near Sector 21 metro'],  issues:['Drainage blockage','Road potholes','Broken streetlights'] },
  rohini:      { score:55, label:'Fair',      risks:['Garbage accumulation in market areas','Sewage overflow in blocks A–C'],     issues:['Garbage collection','Sewage overflow','Encroachment on footpaths'] },
  lajpatnagar: { score:68, label:'Good',      risks:['Flooding near central market','Water supply cuts'],                        issues:['Road damage','Illegal parking','Garbage near market'] },
  connaught:   { score:74, label:'Good',      risks:['Encroachment on pavements','Noise pollution'],                             issues:['Encroachment','Noise','Broken footpath tiles'] },
  karolbagh:   { score:58, label:'Fair',      risks:['Narrow roads prone to flooding','High traffic congestion'],                 issues:['Potholes','Garbage overflow','Streetlight outage'] },
  saket:       { score:76, label:'Good',      risks:['Minor drainage issues','Road repair backlog'],                             issues:['Pothole','Stray animals','Drainage'] },
  janak:       { score:60, label:'Fair',      risks:['Waterlogging in rainy season','Water supply pressure low'],                issues:['Water supply','Drainage','Road damage'] },
  default:     { score:rand(52,72), label:'Fair', risks:['Seasonal waterlogging','Garbage accumulation near markets'],            issues:['Pothole','Garbage','Drainage blockage'] },
};

function mockCityPredictor(msg) {
  const locM = msg.match(/Locality:\s*(.+)/i);
  const loc  = (locM ? locM[1] : 'Delhi').toLowerCase();
  const key  = Object.keys(DELHI_AREAS).find(k => loc.includes(k)) || 'default';
  const d    = DELHI_AREAS[key];
  const score = typeof d.score === 'number' ? d.score : rand(50, 75);
  const facts = [
    'Delhi has over 1,800 km of roads maintained by PWD — one of the largest civic road networks in Asia.',
    'MCD handles waste management for over 3 crore residents across Delhi.',
    'Delhi Jal Board supplies approximately 900 MGD of water daily to the capital.',
    'Over 2 lakh streetlights are managed by Delhi\'s electricity distribution companies.',
  ];
  return {
    civicScore: score,
    scoreLabel: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 45 ? 'Fair' : 'Poor',
    topIssues:  d.issues,
    monsoonRisks: d.risks,
    riskLevel: score >= 70 ? 'Low' : score >= 55 ? 'Medium' : 'High',
    funFact: pick(facts),
  };
}

function mockAiSearch(msg) {
  const m = msg.toLowerCase();
  const category = (() => {
    if (/pothole/.test(m)) return 'pothole';
    if (/garbage|trash|waste/.test(m)) return 'garbage';
    if (/light|lamp/.test(m)) return 'streetlight';
    if (/water/.test(m)) return 'water';
    if (/drain/.test(m)) return 'drainage';
    if (/road/.test(m)) return 'road';
    return null;
  })();
  const status = (() => {
    if (/open|unresolved|pending|new/.test(m)) return 'reported';
    if (/progress|ongoing|working/.test(m)) return 'in-progress';
    if (/resolved|fixed|closed|done/.test(m)) return 'resolved';
    return null;
  })();
  const locationM = m.match(/in\s+([a-z\s]+?)(?:\s+with|\s+that|\s+from|\s+older|$)/i);
  const location  = locationM ? locationM[1].trim() : null;
  const votesM    = m.match(/(\d+)\+?\s*(?:votes|upvotes)/i);
  const minVotes  = votesM ? parseInt(votesM[1]) : 0;
  const dateRange = /today/.test(m) ? 'today' : /this week|last 7/.test(m) ? 'week' : /this month/.test(m) ? 'month' : null;

  const parts = [];
  if (category) parts.push(category.replace(/_/g,' '));
  if (status)   parts.push(`status: ${status}`);
  if (location) parts.push(`in ${location}`);
  if (minVotes) parts.push(`≥${minVotes} votes`);
  if (dateRange) parts.push(dateRange === 'today' ? 'today' : `last ${dateRange}`);

  return { category, status, location, minVotes, dateRange, interpretation: parts.length ? parts.join(', ') : 'all issues' };
}

const STATUS_MSGS = {
  reported:    ['Your complaint has been received and is in the initial review queue. A field officer will be assigned shortly.', 'Your report is awaiting assignment to the concerned department.'],
  'in-progress':['Your complaint has been picked up and is currently being worked on by the assigned department.', 'Field officers are actively working on resolving this issue.'],
  resolved:    ['Great news! Your complaint has been marked resolved by the department.', 'This issue has been addressed and closed by the concerned department.'],
};
const NEXT_ACTIONS = {
  reported:    'You should expect a field visit or status update within 3–5 working days.',
  'in-progress':'A resolution is expected within the next 2–4 working days; monitor the status timeline.',
  resolved:    'Verify the fix on-ground; if unsatisfactory, use the "Reopen" option.',
};
const TIPS = {
  reported:    'If no action within 7 days, you can file an RTI request to the concerned department — we can help you draft one.',
  'in-progress':'Upvoting your issue helps escalate priority; share it with neighbours to increase visibility.',
  resolved:    'Rate the resolution to help the community track department performance.',
};

function mockStatusNarrator(msg) {
  const statusM = msg.match(/Status:\s*(.+)/i);
  const catM    = msg.match(/Category:\s*(.+)/i);
  const ageM    = msg.match(/Age:\s*(\d+)/i);
  const status  = (statusM ? statusM[1].trim() : 'reported').toLowerCase();
  const ageHrs  = ageM ? parseInt(ageM[1]) : 24;
  const conf    = status === 'resolved' ? rand(88,97) : status === 'in-progress' ? rand(60,80) : rand(35,55);
  return {
    statusUpdate: pick(STATUS_MSGS[status] || STATUS_MSGS.reported) + ` This issue has been open for approximately ${ageHrs < 24 ? `${ageHrs} hours` : `${Math.round(ageHrs/24)} day(s)`}.`,
    nextAction:   NEXT_ACTIONS[status] || NEXT_ACTIONS.reported,
    citizenTip:   TIPS[status] || TIPS.reported,
    confidence: conf,
    confidenceLabel: conf >= 75 ? 'High' : conf >= 50 ? 'Medium' : 'Low',
  };
}

const CHATBOT_RESPONSES = {
  report: `To report a civic issue on CivicFix: tap **Report Issue** in the navbar → choose a category → describe the problem → add a photo if possible → confirm your location → submit. Your report goes live instantly and authorities are notified. 📍`,
  track:  `You can track any complaint from the **Public Feed** or by going to **My Profile → My Reports**. Each issue shows a real-time status timeline: Reported → In Progress → Resolved. You'll also get a bell notification when the status changes. 🔔`,
  rights: `As a citizen you have the right to: (1) file a civic complaint with your local municipality, (2) request action status under the **RTI Act 2005** (file online at rtionline.gov.in), (3) escalate to the Chief Minister's grievance portal if unresolved after 30 days. CivicFix's AI Letter Generator can draft the RTI for you — try /generate-letter. ✊`,
  contact:`Key contacts in Delhi — **PWD** (roads/potholes): 1800-11-8585 · **DJB** (water/drainage): 1916 · **MCD** (garbage/streetlights): 155304 · **BSES** (electricity): 19123 · **Delhi Police**: 100. For all civic grievances you can also write at: cm.delhi.gov.in 📞`,
  pothole:`Potholes are handled by PWD (National/State roads) or MCD (local roads). You can report via CivicFix and our AI will draft a formal complaint to the right department. Potholes are typically resolved in 3–5 working days. Rate high severity if it's posing an accident risk. 🕳️`,
  garbage:`Garbage complaints go to MCD. You can call 155304 or report here. Try to photograph the pile and note the exact address. MCD's mandate is 24-hr pickup for reported complaints in most wards. 🗑️`,
  rti:    `The Right to Information Act 2005 lets you ask any government department for records or action status within 30 days. File online at **rtionline.gov.in**. Use CivicFix's **Write Letter** tool (nav bar) to generate a ready-to-submit RTI application. 📄`,
  hello:  `Hi! 👋 I'm CivicFix Assistant. I can help you report civic issues, track complaints, understand your rights, or find the right government department. What would you like to know?`,
  thanks: `You're welcome! Together we make Delhi better. If you spot any civic issue, don't hesitate to report it — every complaint counts. 🏙️`,
};

function mockChatbot(sp, msg) {
  const m = msg.toLowerCase();
  if (/hi|hello|hey|namaste/.test(m)) return CHATBOT_RESPONSES.hello;
  if (/thank/.test(m)) return CHATBOT_RESPONSES.thanks;
  if (/report|submit|file a complaint|how do i/.test(m)) return CHATBOT_RESPONSES.report;
  if (/track|status|follow|my complaint/.test(m)) return CHATBOT_RESPONSES.track;
  if (/right|rti|right to info/.test(m)) return CHATBOT_RESPONSES.rti;
  if (/contact|phone|number|call|municipality|mcd|pwd|djb/.test(m)) return CHATBOT_RESPONSES.contact;
  if (/pothole|road/.test(m)) return CHATBOT_RESPONSES.pothole;
  if (/garbage|trash|waste/.test(m)) return CHATBOT_RESPONSES.garbage;

  // Count-based questions using issues from system prompt context
  if (/how many|count|total|number of/.test(m)) {
    const issueLines = sp.match(/•[^\n]+/g) || [];
    const total = issueLines.length;
    const open  = issueLines.filter(l => /reported/.test(l.toLowerCase())).length;
    if (total > 0) return `There are currently **${total} issues** in the system, with **${open} still open** (reported). You can see all of them in the Public Feed. Want me to help you filter by category or location?`;
    return `I don't see any issues in the feed yet — be the first to report one! Tap **Report Issue** to get started.`;
  }
  if (/drainage|drain/.test(m)) {
    const issueLines = (sp.match(/•[^\n]+/g) || []).filter(l => /drainage/.test(l.toLowerCase()));
    if (issueLines.length > 0) return `There are **${issueLines.length} drainage issue(s)** currently reported — most are being tracked by Delhi Jal Board. Drainage issues typically resolve in 5–7 working days. Do you want to report a new one?`;
    return `I don't see any open drainage issues right now — if you've spotted one, report it! Delhi Jal Board typically resolves drainage complaints in 5–7 days.`;
  }
  return `That's a great civic question! For specific help, try: "how do I report a pothole", "know my rights", or "contact municipality". You can also browse the **Public Feed** to see all active issues in your area. 🏙️`;
}

function mockTranslator(msg) {
  const firstLine = msg.split('\n')[0];
  const ref = firstLine.match(/CF-[\d-]+/)?.[0] || `CF-${rand(10000,99999)}`;
  return `संदर्भ: ${ref}
दिनांक: ${new Date().toLocaleDateString('hi-IN')}

सेवा में,
माननीय आयुक्त महोदय,
नगर निगम / लोक निर्माण विभाग,
नई दिल्ली।

विषय: नागरिक समस्या के संबंध में औपचारिक शिकायत।

महोदय / महोदया,

मैं आपके संज्ञान में निम्नलिखित नागरिक समस्या लाना चाहता/चाहती हूँ जो हमारे क्षेत्र में गंभीर असुविधा का कारण बन रही है:

[मूल शिकायत का हिंदी अनुवाद यहाँ होगा]

यह समस्या लंबे समय से बनी हुई है और नागरिकों के स्वास्थ्य एवं सुरक्षा के लिए हानिकारक है। मैं अनुरोध करता/करती हूँ कि आप इस मामले में शीघ्र संज्ञान लेकर उचित कार्यवाही करने की कृपा करें।

यदि निर्धारित समय सीमा में समाधान न हो, तो मैं सूचना का अधिकार अधिनियम, 2005 के तहत आवेदन करने के अपने अधिकार का प्रयोग करने को बाध्य होऊँगा/होऊँगी।

आपकी त्वरित एवं सकारात्मक कार्यवाही की प्रत्याशा में,

भवदीय,
[आपका नाम एवं पता]
दिनांक: ${new Date().toLocaleDateString('hi-IN')}

⚡ CivicFix AI द्वारा अनुवादित · कृपया भेजने से पहले समीक्षा करें`;
}

function mockDupDetector(sp, msg) {
  const titleM  = msg.match(/Title="([^"]+)"/i);
  const catM    = msg.match(/Category="([^"]+)"/i);
  const newTitle = titleM ? titleM[1].toLowerCase() : '';
  const lines    = msg.split('\n').filter(l => l.startsWith('ID:'));
  let best = null, bestScore = 0;
  lines.forEach(line => {
    const idM    = line.match(/ID:([^\s|]+)/);
    const titleP = line.split('|')[1]?.toLowerCase() || '';
    const words1 = new Set(newTitle.split(/\W+/).filter(w => w.length > 3));
    const words2 = titleP.split(/\W+/).filter(w => w.length > 3);
    const overlap = words2.filter(w => words1.has(w)).length;
    const score   = words1.size > 0 ? Math.round((overlap / Math.max(words1.size, 1)) * 100) : 0;
    if (score > bestScore) { bestScore = score; best = idM ? idM[1] : null; }
  });
  const isDuplicate = bestScore > 75;
  return {
    isDuplicate, matchedIssueId: isDuplicate ? best : null,
    similarity: bestScore,
    reason: isDuplicate
      ? `Titles share significant overlap (${bestScore}% similarity). Consider upvoting the existing report instead.`
      : `No sufficiently similar issue found (highest match: ${bestScore}%). Your report appears to be unique.`,
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function askClaude(systemPrompt = '', userMessage = '', maxTokens = 1024) {
  await sleep(rand(400, 900));
  const feature = detectFeature(systemPrompt);

  const map = {
    issueAnalyser:  () => JSON.stringify(mockIssueAnalyser(userMessage)),
    healthScore:    () => JSON.stringify(mockHealthScore(userMessage)),
    priorityActions:() => JSON.stringify(mockPriorityActions(userMessage)),
    hotspots:       () => JSON.stringify(mockHotspots(userMessage)),
    sentiment:      () => JSON.stringify(mockSentiment(userMessage)),
    resolution:     () => JSON.stringify(mockResolution(userMessage)),
    letterGen:      () => mockLetterGen(userMessage),
    voice:          () => JSON.stringify(mockVoice(userMessage)),
    cityPredictor:  () => JSON.stringify(mockCityPredictor(userMessage)),
    aiSearch:       () => JSON.stringify(mockAiSearch(userMessage)),
    statusNarrator: () => JSON.stringify(mockStatusNarrator(userMessage)),
    chatbot:        () => mockChatbot(systemPrompt, userMessage),
    translator:     () => mockTranslator(userMessage),
    dupDetector:    () => JSON.stringify(mockDupDetector(systemPrompt, userMessage)),
    generic:        () => JSON.stringify({ message: 'AI response simulated.' }),
  };

  return (map[feature] || map.generic)();
}

// ─── Mock vision client (Feature 4 — photo analysis) ─────────────────────────
const PHOTO_PROBLEMS = [
  { problem:'Pothole', severity:4, description:'A significant pothole is visible in the road surface, approximately 1–2 feet in diameter. The damage poses a risk to vehicles and pedestrians and requires immediate patching by PWD.' },
  { problem:'Garbage accumulation', severity:3, description:'Waste material has accumulated at this location, indicating a missed collection or illegal dumping. The MCD safai team should be notified for immediate clearance.' },
  { problem:'Broken streetlight', severity:3, description:'The streetlight pole or lamp appears non-functional in this image. This creates a safety hazard at night and should be reported to the electricity department.' },
  { problem:'Drainage overflow', severity:4, description:'Water or sewage overflow is visible, likely due to a blocked drain or broken pipe. This poses a health risk and requires urgent DJB inspection.' },
  { problem:'Road damage', severity:3, description:'Visible road surface damage including cracks or uneven tarmac. The PWD should be alerted for resurfacing before the damage worsens.' },
  { problem:'Encroachment on footpath', severity:2, description:'The footpath appears to be encroached upon by a temporary structure, reducing pedestrian access. MCD Enforcement Wing should be informed.' },
];

const client = {
  messages: {
    async create({ messages }) {
      await sleep(rand(600, 1200));
      const hasImage = messages?.[0]?.content?.some?.(c => c.type === 'image');
      if (!hasImage) return { content: [{ text: '{}' }] };
      const p = pick(PHOTO_PROBLEMS);
      return { content: [{ text: JSON.stringify({ ...p, confidence: rand(83, 96) }) }] };
    },
  },
};

export default client;
