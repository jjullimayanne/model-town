import { useGame } from '../../store/gameStore';

/**
 * Chart colours per theme. Both 2-series palettes were checked with the dataviz validator
 * (light on #ffffff, dark on #2f3452); every line chart also ships a legend + direct labels.
 */
const THEMES = {
  dark: {
    SERIES: { train: '#8f7fe0', test: '#c4852f' },
    INK: { axis: '#a9aac4', grid: 'rgba(169,170,196,0.14)' },
    MAG: '#8cbf93',
    surface: '#2f3452',
    text: '#e8e6f0',
  },
  light: {
    SERIES: { train: '#7b6fc0', test: '#c98136' },
    INK: { axis: '#6b7089', grid: 'rgba(47,51,70,0.10)' },
    MAG: '#5f9e75',
    surface: '#ffffff',
    text: '#2f3346',
  },
} as const;

export function useChart() {
  const theme = useGame((s) => s.theme);
  const c = THEMES[theme];
  return {
    SERIES: c.SERIES,
    INK: c.INK,
    MAG: c.MAG,
    textColor: c.text,
    tooltipStyle: {
      contentStyle: { borderRadius: 12, border: `1px solid ${c.INK.axis}`, background: c.surface, color: c.text, fontFamily: 'Nunito', fontSize: 13 },
      labelStyle: { fontWeight: 800, color: c.text },
      itemStyle: { color: c.text },
    },
  };
}

/** Non-hook access for places outside charts (e.g. static bars). */
export const SERIES_STATIC = THEMES.dark.SERIES;
