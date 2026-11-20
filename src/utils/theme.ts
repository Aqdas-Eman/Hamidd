import type { ThemeAccent } from '../types/app';

export interface ThemePalette {
  primary: string;
  primaryHover: string;
  secondary: string;
  glow: string;
  border: string;
  softBg: string;
  label: string;
}

export const THEME_PALETTES: Record<ThemeAccent, ThemePalette> = {
  'rose-gold': {
    primary: '#e28794',
    primaryHover: '#d37280',
    secondary: '#d9b37c',
    glow: 'rgba(226, 135, 148, 0.22)',
    border: 'rgba(217, 179, 124, 0.24)',
    softBg: 'rgba(226, 135, 148, 0.12)',
    label: 'Rose Gold',
  },
  champagne: {
    primary: '#d9b37c',
    primaryHover: '#c79e64',
    secondary: '#f2dec0',
    glow: 'rgba(217, 179, 124, 0.22)',
    border: 'rgba(217, 179, 124, 0.28)',
    softBg: 'rgba(217, 179, 124, 0.12)',
    label: 'Champagne Gold',
  },
  blush: {
    primary: '#f09cae',
    primaryHover: '#e18297',
    secondary: '#f7d5dc',
    glow: 'rgba(240, 156, 174, 0.22)',
    border: 'rgba(240, 156, 174, 0.25)',
    softBg: 'rgba(240, 156, 174, 0.12)',
    label: 'Soft Blush',
  },
  crimson: {
    primary: '#d65a6e',
    primaryHover: '#bf465a',
    secondary: '#e6b87d',
    glow: 'rgba(214, 90, 110, 0.24)',
    border: 'rgba(230, 184, 125, 0.24)',
    softBg: 'rgba(214, 90, 110, 0.14)',
    label: 'Velvet Crimson',
  },
};

export function getThemePalette(accent?: ThemeAccent): ThemePalette {
  return THEME_PALETTES[accent || 'rose-gold'] || THEME_PALETTES['rose-gold'];
}
