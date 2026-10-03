/* Black Traveller Index — an EDITORIAL planning estimate, not an official statistic.
 * No authoritative global "racism index for travellers" exists. This combines:
 *   r  = risk of anti-Black racism / anti-African xenophobia a Black African visitor may meet
 *        1 Low (Black-majority, welcoming)  2 Some  3 Notable  4 High
 *   safety (from data.js) = general physical safety / advisories
 * Index (0–100, higher = more comfortable) = 100 − 14×(safety−1) − 22×(r−1); capped at 25 where safety = 4 (Avoid).
 * Racism is weighted more heavily than general safety on purpose. Cross-check government advisories,
 * ECRI country reports, and recent traveller accounts before you book.
 */
const BLACK = {
  'benin':        { r:1, n:'Black-majority society with no notable anti-Black racism. Expect to be read as local, so agree taxi and market prices before you start.' },
  'burkina-faso': { r:1, n:'Black-majority. Racism is not the concern here, security is. See the safety rating.' },
  'cabo-verde':   { r:1, n:'Afro-Portuguese Creole society, welcoming to visitors of African descent. Some prejudice toward continental African migrants has been reported, but tourists rarely meet it.' },
  'cote-divoire': { r:1, n:'Black-majority. Political tensions around nationality ("ivoirité") exist, but visitors rarely encounter hostility.' },
  'gambia':       { r:1, n:'Black-majority and tourist-friendly. The main nuisance is persistent touts on tourist beaches, which happens to all visitors.' },
  'guinea':       { r:1, n:'Black-majority. Concern is political unrest and thin infrastructure, not racism.' },
  'guinea-bissau':{ r:1, n:'Black-majority. Concern is political instability, not racism.' },
  'liberia':      { r:1, n:'Black-majority with deep US-diaspora ties. Welcoming, and a popular first stop for diaspora travellers.' },
  'mali':         { r:1, n:'Black-majority. Concern is the security situation and blockades, not racism.' },
  'niger':        { r:1, n:'Black-majority. Concern is the security situation and border closures, not racism.' },
  'nigeria':      { r:1, n:'Black-majority. Ghana–Nigeria rivalry (trade, football, jollof) shows up as banter and occasionally in headlines; visitors are rarely affected.' },
  'senegal':      { r:1, n:'Black-majority, famous for "teranga" hospitality. Dakar street hawkers can be pushy with all foreigners.' },
  'sierra-leone': { r:1, n:'Black-majority and warm toward visitors, with a strong diaspora-return tourism story.' },
  'togo':         { r:1, n:'Black-majority and an easy border crossing from Ghana. No notable anti-Black racism.' },

  'kenya':        { r:1, n:'Black-majority and tourist-experienced. Safari lodges and Nairobi are comfortable; the risk is petty crime and occasional protests, not racism.' },
  'lesotho':      { r:1, n:'Black-majority and rarely visited, so you may attract friendly curiosity. No notable racism.' },
  'malawi':       { r:1, n:'Black-majority and widely described as friendly. No notable racism.' },
  'mauritius':    { r:1, n:'Multi-ethnic island. The Afro-Mauritian (Creole) community is socially marginalised in places, but visitors of African descent are generally welcomed; resorts are very comfortable.' },
  'mozambique':   { r:1, n:'Black-majority. Concern is regional unrest and police stops, not racism.' },
  'rwanda':       { r:1, n:'Black-majority, clean and orderly, strongly pro-visitor. Among the most comfortable places in Africa to travel.' },
  'seychelles':   { r:1, n:'Majority Creole and mixed heritage population. Welcoming; resorts are mostly insulated from any tension.' },
  'south-africa': { r:3, n:'Black-majority, but recurring anti-foreigner (Afrophobic) campaigns and attacks have targeted other African nationals, especially in townships, and police can be rough with foreigners. Tourist areas are mostly fine. Carry ID, stay in tourist-friendly neighbourhoods, use ride-hailing.' },
  'eswatini':     { r:1, n:'Black-majority and calm. No notable racism.' },
  'tanzania':     { r:1, n:'Black-majority. Zanzibar and safari areas are tourist-experienced; you may be asked to pay "tourist" prices if mistaken for a foreign visitor.' },
  'uganda':       { r:1, n:'Black-majority and friendly. Note the country\'s harsh anti-LGBTQ laws if that is relevant to you.' },
  'zimbabwe':     { r:1, n:'Black-majority. Economic hardship drives some hustling in tourist areas; racism is not the issue.' },
  'zambia':       { r:1, n:'Black-majority and often called one of Africa\'s friendliest countries.' },
  'morocco':      { r:3, n:'Anti-Black racism is documented in Morocco, mostly aimed at sub-Saharan migrants. Black visitors report stares, being called "azzi" and being assumed to be migrants, though the Marrakech, Essaouira and Casablanca tourist circuits are generally easier. Expect more questions at some checkpoints.' },

  'antigua':      { r:1, n:'Black-majority and warm to African visitors. Immigration may ask closely about onward tickets, hotel and funds for African passports.' },
  'bahamas':      { r:1, n:'Black-majority and welcoming. Anti-Haitian sentiment exists locally but is not aimed at tourists. Expect firm immigration questions on arrival.' },
  'barbados':     { r:1, n:'Black-majority with a strong Pan-African pride culture. Very comfortable for Black travellers.' },
  'dominica':     { r:1, n:'Black-majority nature island. Very comfortable.' },
  'grenada':      { r:1, n:'Black-majority and welcoming; strong Pan-African history and heritage tourism.' },
  'guyana':       { r:1, n:'Mixed African and Indian heritage. Politics is ethnically polarised but visitors are rarely affected.' },
  'jamaica':      { r:1, n:'Black-majority and a heritage-travel favourite. Concern is crime in some areas and recovery after Hurricane Melissa (Oct 2025), not racism.' },
  'st-kitts-nevis':{ r:1, n:'Black-majority and calm. Very comfortable.' },
  'st-vincent':   { r:1, n:'Black-majority and relaxed. Very comfortable.' },
  'trinidad-tobago':{ r:1, n:'Mixed Afro- and Indo-Trinidadian society. Ethnic politics are not aimed at visitors; crime in parts of Trinidad is the concern.' },

  'maldives':     { r:2, n:'Very few Black visitors outside resorts, so staring and curiosity are common on local islands. Discrimination against foreign workers has been reported; resort stays are insulated. Data is limited.' },
  'singapore':    { r:2, n:'Very safe with strict laws against racial harassment, but everyday prejudice against Black people and Africans has been reported (stares, housing, jobs), and Africans can face closer immigration questions. Tourists are usually fine. Pack hair and skin-care products you rely on.' },
  'fiji':         { r:2, n:'Black visitors are rare, so curiosity is common and usually friendly. Reliable data on experiences is thin, so treat this as unverified.' }
};

// Merge into DESTINATIONS and compute the index.
(function mergeBlack() {
  for (const d of DESTINATIONS) {
    const b = BLACK[d.id] || { r: 2, n: 'No assessment yet.' };
    d.race = b.r;
    d.raceNote = b.n;
    const raw = 100 - 14 * (d.safety - 1) - 22 * (b.r - 1);
    d.bti = Math.max(5, Math.round(d.safety === 4 ? Math.min(raw, 25) : raw));
  }
})();

const RACE_LABEL = { 1: 'Low', 2: 'Some', 3: 'Notable', 4: 'High' };
const bandBti = n => n >= 80 ? 'Very comfortable' : n >= 60 ? 'Comfortable' : n >= 40 ? 'Mixed' : 'Caution';
const BLACK_TIPS = [
  'Carry your passport, yellow-fever card, hotel booking and onward/return ticket. African passports are often checked more closely at borders, especially into the Caribbean and Asia.',
  'Pack hair and skin-care products you rely on. Availability for Black hair and skin varies a lot, especially in Asia, the Maldives and the Indian Ocean islands.',
  'Use licensed taxis or ride-hailing apps, and agree prices up front, since you may be assumed to be a local or a migrant depending on where you are.',
  'Check the government travel advisory and recent traveller reports (YouTube, Reddit, Black Travel Alliance posts) for the month you plan to go.',
  'If you are stopped by police or officials, stay calm, stay polite, ask for ID, and keep copies of your documents in a separate bag.'
];
