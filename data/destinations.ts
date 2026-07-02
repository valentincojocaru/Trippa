/* ============================================================
   Trippa — data/destinations.ts
   Curated global destination database for the premium autocomplete
   (keyless fallback for Google Places). Ported verbatim from the
   reference app's destinations.js.
   ============================================================ */

import type { Place } from "@/lib/types";

const D: Place[] = [
    // ---- Europe ----
    {city:'Paris',country:'France',flag:'🇫🇷',iata:'CDG',type:'city',ph:'1502602898657-3e91760cbb34',tags:['popular','romantic','city']},
    {city:'Rome',country:'Italy',flag:'🇮🇹',iata:'FCO',type:'city',ph:'1552832230-c0197dd311b5',tags:['popular','city']},
    {city:'Barcelona',country:'Spain',flag:'🇪🇸',iata:'BCN',type:'city',ph:'1583422409516-2895a77efded',tags:['popular','trending','city']},
    {city:'London',country:'United Kingdom',flag:'🇬🇧',iata:'LHR',type:'city',ph:'1513635269975-59663e0ac1ad',tags:['popular','city']},
    {city:'Lisbon',country:'Portugal',flag:'🇵🇹',iata:'LIS',type:'city',ph:'1585208798174-6cedd86e019a',tags:['trending','city']},
    {city:'Porto',country:'Portugal',flag:'🇵🇹',iata:'OPO',type:'city',tags:['trending','city']},
    {city:'Amsterdam',country:'Netherlands',flag:'🇳🇱',iata:'AMS',type:'city',ph:'1534351590666-13e3e96b5017',tags:['popular','city']},
    {city:'Prague',country:'Czech Republic',flag:'🇨🇿',iata:'PRG',type:'city',ph:'1541849546-216549ae216d',tags:['city']},
    {city:'Vienna',country:'Austria',flag:'🇦🇹',iata:'VIE',type:'city',ph:'1516550893923-42d28e5677af',tags:['city']},
    {city:'Venice',country:'Italy',flag:'🇮🇹',iata:'VCE',type:'city',ph:'1514890547357-a9ee288728e0',tags:['popular','romantic','city']},
    {city:'Florence',country:'Italy',flag:'🇮🇹',iata:'FLR',type:'city',ph:'1541370976299-4d24ebbc9077',tags:['romantic','city']},
    {city:'Santorini',country:'Greece',flag:'🇬🇷',iata:'JTR',type:'island',ph:'1570077188670-e3a8d69ac5ff',tags:['trending','romantic','island','beach']},
    {city:'Mykonos',country:'Greece',flag:'🇬🇷',iata:'JMK',type:'island',tags:['island','beach','trending']},
    {city:'Athens',country:'Greece',flag:'🇬🇷',iata:'ATH',type:'city',tags:['city']},
    {city:'Reykjavik',country:'Iceland',flag:'🇮🇸',iata:'KEF',type:'city',ph:'1504284769763-78de80f1e3b3',tags:['mountain','trending']},
    {city:'Edinburgh',country:'Scotland',flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',iata:'EDI',type:'city',ph:'1506377585622-bedcbb027afc',tags:['city']},
    {city:'Madrid',country:'Spain',flag:'🇪🇸',iata:'MAD',type:'city',tags:['city']},
    {city:'Seville',country:'Spain',flag:'🇪🇸',iata:'SVQ',type:'city',tags:['city','romantic']},
    {city:'Berlin',country:'Germany',flag:'🇩🇪',iata:'BER',type:'city',tags:['city']},
    {city:'Munich',country:'Germany',flag:'🇩🇪',iata:'MUC',type:'city',tags:['city']},
    {city:'Budapest',country:'Hungary',flag:'🇭🇺',iata:'BUD',type:'city',tags:['city','trending']},
    {city:'Copenhagen',country:'Denmark',flag:'🇩🇰',iata:'CPH',type:'city',tags:['city']},
    {city:'Stockholm',country:'Sweden',flag:'🇸🇪',iata:'ARN',type:'city',tags:['city']},
    {city:'Dublin',country:'Ireland',flag:'🇮🇪',iata:'DUB',type:'city',tags:['city']},
    {city:'Zurich',country:'Switzerland',flag:'🇨🇭',iata:'ZRH',type:'city',tags:['city']},
    {city:'Swiss Alps',country:'Switzerland',flag:'🇨🇭',iata:'ZRH',type:'mountain',ph:'1531366936337-7c912a4589a7',tags:['mountain','ski','trending']},
    {city:'Zermatt',country:'Switzerland',flag:'🇨🇭',iata:'ZRH',type:'ski',tags:['ski','mountain']},
    {city:'Chamonix',country:'France',flag:'🇫🇷',iata:'GVA',type:'ski',tags:['ski','mountain']},
    {city:'Warsaw',country:'Poland',flag:'🇵🇱',iata:'WAW',type:'city',tags:['city']},
    {city:'Krakow',country:'Poland',flag:'🇵🇱',iata:'KRK',type:'city',tags:['city']},
    {city:'Pisa',country:'Italy',flag:'🇮🇹',iata:'PSA',type:'city',tags:['city']},
    {city:'Amalfi Coast',country:'Italy',flag:'🇮🇹',iata:'NAP',type:'beach',tags:['beach','romantic','trending']},
    {city:'Dubrovnik',country:'Croatia',flag:'🇭🇷',iata:'DBV',type:'city',tags:['city','beach','trending']},
    {city:'Split',country:'Croatia',flag:'🇭🇷',iata:'SPU',type:'beach',tags:['beach','city']},
    {city:'Ibiza',country:'Spain',flag:'🇪🇸',iata:'IBZ',type:'island',tags:['island','beach']},
    {city:'Mallorca',country:'Spain',flag:'🇪🇸',iata:'PMI',type:'island',tags:['island','beach','family']},
    {city:'Nice',country:'France',flag:'🇫🇷',iata:'NCE',type:'beach',tags:['beach','city','romantic']},
    {city:'Oslo',country:'Norway',flag:'🇳🇴',iata:'OSL',type:'city',tags:['city','mountain']},
    {city:'Bergen',country:'Norway',flag:'🇳🇴',iata:'BGO',type:'mountain',tags:['mountain']},

    // ---- Asia ----
    {city:'Tokyo',country:'Japan',flag:'🇯🇵',iata:'HND',type:'city',ph:'1540959733332-eab4deabeeaf',tags:['popular','trending','city']},
    {city:'Kyoto',country:'Japan',flag:'🇯🇵',iata:'KIX',type:'city',ph:'1493976040374-85c8e12f0c0e',tags:['city','romantic']},
    {city:'Osaka',country:'Japan',flag:'🇯🇵',iata:'KIX',type:'city',tags:['city']},
    {city:'Bali',country:'Indonesia',flag:'🇮🇩',iata:'DPS',type:'island',ph:'1537996194471-e657df975ab4',tags:['trending','island','beach','romantic']},
    {city:'Bangkok',country:'Thailand',flag:'🇹🇭',iata:'BKK',type:'city',ph:'1508009603885-50cf7c579365',tags:['popular','city']},
    {city:'Phuket',country:'Thailand',flag:'🇹🇭',iata:'HKT',type:'beach',tags:['beach','island','family']},
    {city:'Chiang Mai',country:'Thailand',flag:'🇹🇭',iata:'CNX',type:'city',tags:['city','mountain','trending']},
    {city:'Singapore',country:'Singapore',flag:'🇸🇬',iata:'SIN',type:'city',ph:'1525625293386-3f8f99389edd',tags:['trending','city','family']},
    {city:'Seoul',country:'South Korea',flag:'🇰🇷',iata:'ICN',type:'city',ph:'1538485399081-7191377e8241',tags:['trending','city']},
    {city:'Hanoi',country:'Vietnam',flag:'🇻🇳',iata:'HAN',type:'city',ph:'1509030450996-dd1a26dda341',tags:['trending','city']},
    {city:'Ho Chi Minh City',country:'Vietnam',flag:'🇻🇳',iata:'SGN',type:'city',tags:['city']},
    {city:'Hong Kong',country:'China',flag:'🇭🇰',iata:'HKG',type:'city',tags:['city']},
    {city:'Maldives',country:'Maldives',flag:'🇲🇻',iata:'MLE',type:'island',ph:'1514282401047-d79a71a590e8',tags:['trending','island','beach','romantic']},
    {city:'Dubai',country:'UAE',flag:'🇦🇪',iata:'DXB',type:'city',ph:'1512453979798-5ea266f8880c',tags:['trending','city','family']},
    {city:'Abu Dhabi',country:'UAE',flag:'🇦🇪',iata:'AUH',type:'city',tags:['city']},
    {city:'Istanbul',country:'Turkey',flag:'🇹🇷',iata:'IST',type:'city',ph:'1541432901042-2d8bd64b4a9b',tags:['trending','city']},
    {city:'Cappadocia',country:'Turkey',flag:'🇹🇷',iata:'NAV',type:'mountain',tags:['trending','mountain','romantic']},
    {city:'Kuala Lumpur',country:'Malaysia',flag:'🇲🇾',iata:'KUL',type:'city',tags:['city']},
    {city:'Jaipur',country:'India',flag:'🇮🇳',iata:'JAI',type:'city',tags:['city']},
    {city:'Goa',country:'India',flag:'🇮🇳',iata:'GOI',type:'beach',tags:['beach']},
    {city:'Colombo',country:'Sri Lanka',flag:'🇱🇰',iata:'CMB',type:'city',tags:['city','beach']},

    // ---- Americas ----
    {city:'New York',country:'USA',flag:'🇺🇸',iata:'JFK',type:'city',ph:'1496442226666-8d4d0e62e6e9',tags:['popular','city']},
    {city:'Phoenix',country:'USA',flag:'🇺🇸',iata:'PHX',type:'city',tags:['city']},
    {city:'Los Angeles',country:'USA',flag:'🇺🇸',iata:'LAX',type:'city',tags:['city','beach']},
    {city:'San Francisco',country:'USA',flag:'🇺🇸',iata:'SFO',type:'city',tags:['city']},
    {city:'Miami',country:'USA',flag:'🇺🇸',iata:'MIA',type:'beach',tags:['beach','city']},
    {city:'Las Vegas',country:'USA',flag:'🇺🇸',iata:'LAS',type:'city',tags:['city']},
    {city:'Honolulu',country:'USA',flag:'🇺🇸',iata:'HNL',type:'beach',tags:['beach','island','romantic']},
    {city:'Grand Canyon',country:'USA',flag:'🇺🇸',iata:'FLG',type:'park',tags:['park','mountain','family']},
    {city:'Yellowstone',country:'USA',flag:'🇺🇸',iata:'WYS',type:'park',tags:['park','family']},
    {city:'Cancún',country:'Mexico',flag:'🇲🇽',iata:'CUN',type:'beach',tags:['beach','family','trending']},
    {city:'Mexico City',country:'Mexico',flag:'🇲🇽',iata:'MEX',type:'city',ph:'1518105779142-d975f22f1b0a',tags:['city','trending']},
    {city:'Tulum',country:'Mexico',flag:'🇲🇽',iata:'CUN',type:'beach',tags:['beach','romantic','trending']},
    {city:'Rio de Janeiro',country:'Brazil',flag:'🇧🇷',iata:'GIG',type:'city',ph:'1483729558449-99ef09a8c325',tags:['city','beach']},
    {city:'Buenos Aires',country:'Argentina',flag:'🇦🇷',iata:'EZE',type:'city',tags:['city']},
    {city:'Patagonia',country:'Argentina',flag:'🇦🇷',iata:'FTE',type:'mountain',tags:['mountain','park','trending']},
    {city:'Cusco',country:'Peru',flag:'🇵🇪',iata:'CUZ',type:'mountain',tags:['mountain','trending']},
    {city:'Cartagena',country:'Colombia',flag:'🇨🇴',iata:'CTG',type:'beach',tags:['beach','city','romantic']},
    {city:'Toronto',country:'Canada',flag:'🇨🇦',iata:'YYZ',type:'city',tags:['city']},
    {city:'Vancouver',country:'Canada',flag:'🇨🇦',iata:'YVR',type:'city',tags:['city','mountain']},
    {city:'Banff',country:'Canada',flag:'🇨🇦',iata:'YYC',type:'park',tags:['park','mountain','ski','trending']},

    // ---- Africa & Middle East ----
    {city:'Marrakech',country:'Morocco',flag:'🇲🇦',iata:'RAK',type:'city',ph:'1597211833712-5e41faa202ea',tags:['trending','city']},
    {city:'Cape Town',country:'South Africa',flag:'🇿🇦',iata:'CPT',type:'city',ph:'1580060839134-75a5edca2e99',tags:['trending','city','mountain']},
    {city:'Cairo',country:'Egypt',flag:'🇪🇬',iata:'CAI',type:'city',ph:'1572252009286-268acec5ca0a',tags:['city']},
    {city:'Zanzibar',country:'Tanzania',flag:'🇹🇿',iata:'ZNZ',type:'island',tags:['island','beach','romantic']},
    {city:'Serengeti',country:'Tanzania',flag:'🇹🇿',iata:'JRO',type:'park',tags:['park','trending']},
    {city:'Nairobi',country:'Kenya',flag:'🇰🇪',iata:'NBO',type:'city',tags:['city','park']},
    {city:'Petra',country:'Jordan',flag:'🇯🇴',iata:'AMM',type:'park',tags:['park','trending']},

    // ---- Oceania ----
    {city:'Sydney',country:'Australia',flag:'🇦🇺',iata:'SYD',type:'city',ph:'1506973035872-a4ec16b8e8d9',tags:['popular','city','beach']},
    {city:'Melbourne',country:'Australia',flag:'🇦🇺',iata:'MEL',type:'city',tags:['city']},
    {city:'Queenstown',country:'New Zealand',flag:'🇳🇿',iata:'ZQN',type:'mountain',tags:['mountain','ski','trending']},
    {city:'Auckland',country:'New Zealand',flag:'🇳🇿',iata:'AKL',type:'city',tags:['city']},
    {city:'Bora Bora',country:'French Polynesia',flag:'🇵🇫',iata:'BOB',type:'island',tags:['island','beach','romantic','trending']},
    {city:'Fiji',country:'Fiji',flag:'🇫🇯',iata:'NAN',type:'island',tags:['island','beach','romantic']},
  ];

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function score(d: Place, q: string): number {
  const c = norm(d.city), co = norm(d.country), ia = norm(d.iata);
  if (c.startsWith(q)) return 0;
  if (co.startsWith(q)) return 1;
  if (ia === q) return 1;
  if (c.includes(" " + q)) return 2;
  if (c.includes(q)) return 3;
  if (co.includes(q)) return 4;
  return -1;
}

export function searchDestinations(q: string, limit = 6): Place[] {
  q = norm((q || "").trim());
  if (!q) return [];
  return D.map((d) => ({ d, s: score(d, q) }))
    .filter((x) => x.s >= 0)
    .sort(
      (a, b) =>
        a.s - b.s ||
        Number(b.d.tags.includes("trending")) - Number(a.d.tags.includes("trending")) ||
        b.d.tags.length - a.d.tags.length
    )
    .slice(0, limit)
    .map((x) => x.d);
}

/* Curated id → fast Unsplash. Destinations without a curated id get a REAL
   photo of the place via Wikipedia at render time (lib/destPhoto.ts) — never
   a random stock photo of somewhere else. */
export function photoURL(d: Place, size = 160): string {
  if (d.ph)
    return `https://images.unsplash.com/photo-${d.ph}?w=${size}&h=${size}&fit=crop&q=70`;
  return "";
}

export const byTag = (t: string) => D.filter((d) => d.tags.includes(t));
export const popular = byTag("popular").slice(0, 8);
export const trending = byTag("trending").slice(0, 8);
export const allDestinations = D;

export const categories = [
  { key: "trending", label: "🔥 Trending now" },
  { key: "beach", label: "🏖️ Beach escapes" },
  { key: "city", label: "🏙️ City breaks" },
  { key: "mountain", label: "⛰️ Mountains" },
  { key: "island", label: "🏝️ Islands" },
  { key: "ski", label: "🎿 Ski resorts" },
  { key: "park", label: "🌲 National parks" },
  { key: "romantic", label: "💕 Romantic" },
  { key: "family", label: "👨‍👩‍👧 Family" },
];
