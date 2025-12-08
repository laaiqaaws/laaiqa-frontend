// Laaiqa color palette
export const COLORS = {
  primary: {
    300: '#EE2377',  // Brighter pink - for highlights, hover states
    400: '#C40F5A',  // Darker pink - for text, buttons, accents
    DEFAULT: '#C40F5A'
  },
  secondary: '#F46CA4',  // Pink flag/tag color
  background: '#100D0F',
  blue: '#0063E4',
  green: '#1FC16B',      // Status green
  red: '#D00416',
  yellow: '#F5DE78',
  orange: '#F07229',     // Month indicator orange
  surface: '#1A1518',
  border: '#2A2428',
  muted: '#3A3438',
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    muted: '#A0A0A0',
    accent: '#C40F5A'
  },
  // Card background colors
  cards: {
    purple: '#CD8FDE',   // Purple card
    pink: '#F9B6D2',     // Pink card
    peach: '#FACCB2',    // Peach/orange card
    green: '#B5EAD7',    // Mint green card
    coral: '#FFDAC1',    // Coral card
  }
} as const;

// Card colors array for cycling through
export const CARD_COLORS = [
  '#CD8FDE',  // Purple
  '#FACCB2',  // Peach
  '#F9B6D2',  // Pink
  '#B5EAD7',  // Mint green
  '#FFDAC1',  // Coral
] as const;

// Get card color by index (cycles through)
export function getCardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length];
}