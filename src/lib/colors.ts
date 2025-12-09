export const COLORS = {
  primary: {
    300: '#EE2377',
    400: '#C40F5A',
    DEFAULT: '#C40F5A'
  },
  secondary: '#F46CA4',
  background: '#100D0F',
  blue: '#0063E4',
  green: '#1FC16B',
  red: '#D00416',
  yellow: '#F5DE78',
  orange: '#F07229',
  surface: '#1A1518',
  border: '#2A2428',
  muted: '#3A3438',
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    muted: '#A0A0A0',
    accent: '#C40F5A'
  },
  cards: {
    purple: '#CD8FDE',
    pink: '#F9B6D2',
    peach: '#FACCB2',
    green: '#B5EAD7',
    coral: '#FFDAC1',
  }
} as const;

export const CARD_COLORS = ['#CD8FDE', '#FACCB2', '#F9B6D2', '#B5EAD7', '#FFDAC1'] as const;

export function getCardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length];
}
