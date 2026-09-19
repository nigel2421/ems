/** Kenyan political formations used across Polling Intelligence. */

export const KENYA_PARTIES = [
  'UDA',
  'ODM',
  'Wiper',
  'Jubilee',
  'Ford Kenya',
  'DAP-K',
  'ANC',
  'KANU',
  'UPA',
  'Independent',
  'Other'
];

export const KENYA_COALITIONS = [
  'Kenya Kwanza',
  'Azimio la Umoja',
  'Unaligned',
  'Contested / fluid'
];

export const STREAM_TERRAIN = [
  { value: 'Stronghold', label: 'Stronghold (base)' },
  { value: 'Lean', label: 'Lean (favourable)' },
  { value: 'Swing', label: 'Swing / battleground' },
  { value: 'Contested', label: 'Heavily contested' },
  { value: 'Hostile', label: 'Hostile / opposition base' }
];

export const MOBILISATION_CHANNELS = [
  'Churches & mosques',
  'Markets & boda stages',
  'Youth / campus blocs',
  'Women chama networks',
  'Nyumba Kumi / village elders',
  'Trade unions & SACCOs',
  'Social media / WhatsApp',
  'Door-to-door / Nyumba'
];

export const ELECTION_RISK_HINTS = {
  Low: 'Calm stream — routine Form 34A control',
  Medium: 'Watch turnout suppression or agent gaps',
  High: 'Likely flashpoint — reinforce agents & observers',
  Severe: 'High tension — escalate to county ops desk'
};

export const defaultKenyaIntel = () => ({
  partyAdvantageScore: 55,
  incumbencyScore: 50,
  oppositionStrength: 45,
  publicPerceptionRating: 3.5,
  competitorActivityLevel: 'Medium',
  strategicImportance: 'Medium',
  riskLevel: 'Low',
  leadingFormation: 'UDA',
  rivalFormation: 'ODM',
  coalitionLean: 'Contested / fluid',
  streamTerrain: 'Swing',
  mobilisationChannel: 'Markets & boda stages'
});

export const terrainFromScore = (score) => {
  const n = Number(score ?? 50);
  if (n >= 70) return 'Stronghold';
  if (n >= 58) return 'Lean';
  if (n >= 42) return 'Swing';
  if (n >= 30) return 'Contested';
  return 'Hostile';
};

export const formationBadgeClass = (formation) => {
  const key = String(formation || '').toLowerCase();
  if (key.includes('uda') || key.includes('kenya kwanza')) return 'psi-formation uda';
  if (key.includes('odm') || key.includes('azimio')) return 'psi-formation odm';
  if (key.includes('wiper')) return 'psi-formation wiper';
  if (key.includes('jubilee')) return 'psi-formation jubilee';
  return 'psi-formation other';
};
