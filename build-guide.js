// Generates GUIDE.md (Notion-style) from data.js. Run: node build-guide.js
const fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('data.js', 'utf8') + ';this.D=DESTINATIONS;this.R=REGIONS;', ctx);
const { D, R } = ctx;
const ENTRY = { free: 'Visa-free', voa: 'Visa on arrival', eta: 'eTA / online authorisation' };
const SAFE = { 1: '🟢 Low risk', 2: '🟡 Moderate', 3: '🟠 Elevated', 4: '🔴 Avoid' };
const $ = n => '$' + n.toLocaleString();
const b = a => a.map(x => `- ${x}`).join('\n');
const enc = encodeURIComponent;
let out = `# 🇬🇭 Ghana Passport Atlas\n\n> Ordinary Ghanaian passport · ${D.length} destinations · prices are rough USD planning estimates (return economy from Accra), **not quotes**. Verify visas and advisories before booking. Interactive version: \`index.html\`.\n\n`;
out += `## ⚠️ Read first\n- **Mali, Burkina Faso & Niger left ECOWAS on 29 Jan 2025.** ECOWAS asked members to keep free movement "until further notice", but most governments advise **against travel** there.\n- The "~67 destinations" figure (Henley 2026: 66th–68th) includes more places than this list of ${D.length} (e.g. Haiti, Micronesia, BVI, Montserrat).\n- Several Caribbean/Asia routings can need **transit visas** for Ghanaians (Schengen airport-transit, UK DATV, US transit). Check every connection.\n- Singapore, Kenya, Tanzania, Uganda, Zimbabwe, Zambia entry details vary by source — verify with the official portal.\n\n`;
out += `## 📊 Comparison table\n| Destination | Entry | Flight | Hotel mid | Daily mid | Best time | Safety |\n|---|---|---|---|---|---|---|\n`;
for (const d of D) out += `| ${d.flag} ${d.name} | ${ENTRY[d.entry]} | ${$(d.flight[0])}–${$(d.flight[1])} | ${$(d.hotel[1])} | ${$(d.daily[1])} | ${d.best} | ${SAFE[d.safety]} |\n`;
out += '\n';
for (const [rk, rn] of Object.entries(R)) {
  out += `---\n\n## ${rn}\n\n`;
  for (const d of D.filter(x => x.region === rk)) {
    out += `### ${d.flag} ${d.name}\n`;
    out += `**Entry:** ${ENTRY[d.entry]} · ${d.stay} — ${d.entryNote}\n\n`;
    out += `| | |\n|---|---|\n| ✈️ Flight (return) | ${$(d.flight[0])}–${$(d.flight[1])} · ${d.hours} |\n| 🏨 Hotel / night (budget · mid · luxury) | ${$(d.hotel[0])} · ${$(d.hotel[1])} · ${$(d.hotel[2])} |\n| 🏠 Airbnb / night | ~${$(d.airbnb)} |\n| 🍽️ Daily spend (budget · mid · comfort) | ${$(d.daily[0])} · ${$(d.daily[1])} · ${$(d.daily[2])} |\n| 📅 Best time | ${d.best} |\n| 🛡️ Safety | ${SAFE[d.safety]} — ${d.safetyNote} |\n| 💱 Currency / language | ${d.cur} · ${d.lang} |\n\n`;
    out += `**Getting there:** ${d.flightNote}\n\n**Best spots**\n${b(d.spots)}\n\n**Best activities**\n${b(d.doThings)}\n\n**Eat**\n${b(d.eat)}\n\n`;
    if (d.events) out += `**Events:** ${d.events}\n\n`;
    out += `**Tips**\n${b(d.tips)}\n\n**What's not great**\n${b(d.avoid)}\n\n`;
    out += `**Videos:** [TikTok](https://www.tiktok.com/search?q=${enc(d.name + ' travel guide')}) · [TikTok budget](https://www.tiktok.com/search?q=${enc(d.name + ' budget trip cost')}) · [YouTube](https://www.youtube.com/results?search_query=${enc(d.name + ' travel guide')})\n\n`;
  }
}
out += `---\n\n## Sources\n- Citi Newsroom — Ghana passport ranking 2026: https://citinewsroom.com/2026/01/ghana-misses-africas-top-10-most-powerful-passports-as-seychelles-leads-the-continent/\n- Graphic Online — Ghana 68th on 2026 index: https://www.graphic.com.gh/news/general-news/ghana-passport-ranks-68th-in-worlds-most-power-passports-index-for-2026.html\n- ECOWAS exit of Mali/Burkina/Niger: https://nannews.ng/ecowas-says-mali-b-faso-niger-officially-exit-bloc-today/\n- Passport Index (Ghana): https://www.passportindex.org/passport/ghana/\n- Wikipedia — Visa requirements for Ghanaian citizens: https://en.wikipedia.org/wiki/Visa_requirements_for_Ghanaian_citizens\n`;
fs.writeFileSync('GUIDE.md', out);
console.log('GUIDE.md', out.length, 'chars');
