/* ============================================================
   Trippa — data/countries.ts
   Country reference data (tipping · emergency · tax), ported
   verbatim from the reference features2.js COUNTRY table.
   ============================================================ */

export type CountryInfo = {
  flag: string;
  pol?: string;
  amb?: string;
  gen?: string;
  tip: string;
  taxStd: string;
  taxNote?: string;
  note: string;
};

export const COUNTRY: Record<string, CountryInfo> = {
      'Japan':{flag:'🇯🇵',pol:'110',amb:'119',tip:'no',taxStd:'10%',taxNote:'Tax usually included. Tax-free shopping over ¥5,000 with passport.',note:'Japan is a no-tipping culture — great service is the standard.'},
      'France':{flag:'🇫🇷',pol:'17',amb:'15',gen:'112',tip:'rounded',taxStd:'20%',note:'Service is included by law (“service compris”). Rounding up or leaving small change is a kind gesture, not expected.'},
      'Italy':{flag:'🇮🇹',pol:'113',amb:'118',gen:'112',tip:'rounded',taxStd:'22%',note:'A “coperto” (cover charge) is often on the bill. Tipping is modest — round up or leave a few euro.'},
      'Spain':{flag:'🇪🇸',pol:'091',amb:'061',gen:'112',tip:'rounded',taxStd:'21%',note:'Tipping is not expected. Locals leave small change or round up for good service.'},
      'Portugal':{flag:'🇵🇹',pol:'112',amb:'112',gen:'112',tip:'rounded',taxStd:'23%',note:'Tipping is appreciated but modest — round up or leave 5–10% for great service.'},
      'United Kingdom':{flag:'🇬🇧',pol:'999',amb:'999',gen:'112',tip:'10-15',taxStd:'20%',note:'10–15% is normal in restaurants if no service charge is already added. No need to tip at pubs.'},
      'Scotland':{flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',pol:'999',amb:'999',gen:'112',tip:'10-15',taxStd:'20%',note:'10–15% in restaurants if service isn’t included.'},
      'Ireland':{flag:'🇮🇪',pol:'999',amb:'999',gen:'112',tip:'10-15',taxStd:'23%',note:'10–15% is customary in restaurants.'},
      'Germany':{flag:'🇩🇪',pol:'110',amb:'112',gen:'112',tip:'5-10',taxStd:'19%',note:'Round up or add 5–10%, told to the server when paying.'},
      'Austria':{flag:'🇦🇹',pol:'133',amb:'144',gen:'112',tip:'5-10',taxStd:'20%',note:'Round up or add ~10%.'},
      'Netherlands':{flag:'🇳🇱',pol:'112',amb:'112',gen:'112',tip:'5-10',taxStd:'21%',note:'Service is included; rounding up or ~5–10% is appreciated.'},
      'Switzerland':{flag:'🇨🇭',pol:'117',amb:'144',gen:'112',tip:'rounded',taxStd:'8.1%',note:'Service is included. Round up for good service.'},
      'Greece':{flag:'🇬🇷',pol:'100',amb:'166',gen:'112',tip:'5-10',taxStd:'24%',note:'5–10% is appreciated in tavernas.'},
      'Czech Republic':{flag:'🇨🇿',pol:'158',amb:'155',gen:'112',tip:'10',taxStd:'21%',note:'~10% is standard; tell the server the total when paying.'},
      'Hungary':{flag:'🇭🇺',pol:'107',amb:'104',gen:'112',tip:'10-15',taxStd:'27%',note:'10–15% is normal; check it isn’t already on the bill.'},
      'Poland':{flag:'🇵🇱',pol:'997',amb:'999',gen:'112',tip:'10',taxStd:'23%',note:'~10% for good service.'},
      'Croatia':{flag:'🇭🇷',pol:'192',amb:'194',gen:'112',tip:'10',taxStd:'25%',note:'Round up or ~10% in restaurants.'},
      'Denmark':{flag:'🇩🇰',pol:'112',amb:'112',gen:'112',tip:'rounded',taxStd:'25%',note:'Service is included; tipping is optional.'},
      'Sweden':{flag:'🇸🇪',pol:'112',amb:'112',gen:'112',tip:'rounded',taxStd:'25%',note:'Service is included; round up if you like.'},
      'Norway':{flag:'🇳🇴',pol:'112',amb:'113',gen:'112',tip:'rounded',taxStd:'25%',note:'Tipping is optional — round up for good service.'},
      'Iceland':{flag:'🇮🇸',pol:'112',amb:'112',gen:'112',tip:'no',taxStd:'24%',note:'Tipping is not expected — service is included.'},
      'Turkey':{flag:'🇹🇷',pol:'155',amb:'112',gen:'112',tip:'5-10',taxStd:'20%',note:'5–10% is customary in restaurants.'},
      'UAE':{flag:'🇦🇪',pol:'999',amb:'998',tip:'10-15',taxStd:'5%',note:'A 10% service charge is often added; 10–15% extra is appreciated for great service.'},
      'United States':{flag:'🇺🇸',pol:'911',amb:'911',gen:'911',tip:'15-20',taxStd:'varies',taxNote:'Sales tax is added at checkout and varies by state.',note:'Tipping is expected: 15–20% in restaurants, $1–2 per drink, ~15% for taxis.'},
      'USA':{flag:'🇺🇸',pol:'911',amb:'911',gen:'911',tip:'15-20',taxStd:'varies',taxNote:'Sales tax added at checkout, varies by state.',note:'Tipping is expected: 15–20% in restaurants, $1–2 per drink.'},
      'Canada':{flag:'🇨🇦',pol:'911',amb:'911',gen:'911',tip:'15-20',taxStd:'~13%',note:'Tipping is expected: 15–20% in restaurants.'},
      'Mexico':{flag:'🇲🇽',pol:'911',amb:'911',gen:'911',tip:'10-15',taxStd:'16%',note:'10–15% is customary in restaurants.'},
      'Brazil':{flag:'🇧🇷',pol:'190',amb:'192',tip:'10',taxStd:'varies',note:'A 10% service charge is usually included.'},
      'Argentina':{flag:'🇦🇷',pol:'911',amb:'107',tip:'10',taxStd:'21%',note:'~10% is appreciated; not always included.'},
      'Thailand':{flag:'🇹🇭',pol:'191',amb:'1669',tip:'rounded',taxStd:'7%',note:'Tipping isn’t mandatory; rounding up or leaving small change is kind.'},
      'Indonesia':{flag:'🇮🇩',pol:'110',amb:'118',tip:'rounded',taxStd:'11%',note:'A service charge is often included; round up otherwise.'},
      'Singapore':{flag:'🇸🇬',pol:'999',amb:'995',tip:'no',taxStd:'9%',note:'Tipping is not customary; a service charge is usually included.'},
      'South Korea':{flag:'🇰🇷',pol:'112',amb:'119',tip:'no',taxStd:'10%',note:'No tipping culture — it’s not expected anywhere.'},
      'Vietnam':{flag:'🇻🇳',pol:'113',amb:'115',tip:'rounded',taxStd:'8%',note:'Tipping is appreciated but not expected.'},
      'Australia':{flag:'🇦🇺',pol:'000',amb:'000',gen:'112',tip:'rounded',taxStd:'10%',note:'Tipping is optional — round up for great service.'},
      'New Zealand':{flag:'🇳🇿',pol:'111',amb:'111',gen:'111',tip:'rounded',taxStd:'15%',note:'Tipping is not expected.'},
      'Morocco':{flag:'🇲🇦',pol:'19',amb:'15',tip:'5-10',taxStd:'20%',note:'Small tips (5–10%) are customary and appreciated.'},
      'Egypt':{flag:'🇪🇬',pol:'122',amb:'123',tip:'10',taxStd:'14%',note:'“Baksheesh” (tipping) is part of the culture — ~10% in restaurants.'},
      'South Africa':{flag:'🇿🇦',pol:'10111',amb:'10177',tip:'10-15',taxStd:'15%',note:'10–15% is customary in restaurants.'},
    };

export const TIP_TXT: Record<string, string> = {
  no: "No tipping",
  rounded: "Round up",
  "5-10": "5\u201310%",
  "10": "~10%",
  "10-15": "10\u201315%",
  "15-20": "15\u201320%",
};

export function countryInfo(country?: string | null): { country: string; info: CountryInfo } {
  const info = country ? COUNTRY[country] : undefined;
  return {
    country: country || "your destination",
    info:
      info || {
        flag: "\ud83c\udf0d",
        gen: "112",
        tip: "10-15",
        taxStd: "varies",
        note: "When in doubt, 10\u201315% is a safe tip in most countries. Dial 112 for emergencies across the EU and many other nations.",
      },
  };
}
