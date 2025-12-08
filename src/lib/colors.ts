// Laaiqa color palette
export const COLORS = {
  primary: {
    300: '#EE2377',  // Brighter pink - for highlights, hover states
    400: '#C40F5A',  // Darker pink - for text, buttons, accents
    DEFAULT: '#C40F5A'
  },
  secondary: '#F46CA4',
  background: '#100D0F',
  blue: '#0063E4',
  green: '#1FC16B',
  red: '#D00416',
  yellow: '#F5DE78',
  surface: '#1A1518',
  border: '#2A2428',
  muted: '#3A3438',
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    muted: '#A0A0A0',
    accent: '#C40F5A'  // Using primary 400 for accent text
  }
} as const;