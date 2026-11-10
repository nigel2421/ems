// ====================================================================
// KuraTech Universal Colorblind-Safe Categorical & Risk Palette (QA DEF-05 / CHT-06)
// --------------------------------------------------------------------
// Based on the accessible Okabe-Ito / ColorBrewer qualitative palette,
// keeping brand Green as the first element while ensuring high-contrast
// differentiation across all 10 top counties (e.g., Nairobi vs Kiambu).
// ====================================================================

export const DIVERSE_CATEGORICAL_PALETTE = [
  '#006B3F', // 1. Brand Kenya Forest Green (e.g. Nairobi)
  '#E69F00', // 2. Vibrant Amber / Orange (e.g. Kiambu - clearly distinct from Green)
  '#0072B2', // 3. Deep Blue (e.g. Nakuru)
  '#BB0A21', // 4. Crimson / Red (e.g. Kakamega)
  '#56B4E9', // 5. Sky Cyan (e.g. Mombasa)
  '#CC79A7', // 6. Reddish Purple / Magenta (e.g. Machakos)
  '#D55E00', // 7. Vermilion (e.g. Meru)
  '#009E73', // 8. Bluish Green / Mint (e.g. Kisii)
  '#F0E442', // 9. Yellow Gold (e.g. Bungoma)
  '#7A8288'  // 10. Slate Gray (e.g. Kilifi)
];

export const ACCESSIBLE_RISK_PALETTE = {
  low: {
    bg: '#D8F3E4',
    text: '#073322',
    dot: '#006B3F',
    label: 'Low Risk'
  },
  medium: {
    bg: '#FEF3C7',
    text: '#78350F',
    dot: '#D97706', // High-contrast warm amber
    label: 'Swing / Medium Risk'
  },
  high: {
    bg: 'rgba(187, 10, 33, 0.12)',
    text: '#BB0A21',
    dot: '#BB0A21',
    label: 'High Risk'
  },
  severe: {
    bg: 'rgba(138, 7, 24, 0.22)',
    text: '#8A0718',
    dot: '#8A0718',
    label: 'Severe Risk'
  }
};
