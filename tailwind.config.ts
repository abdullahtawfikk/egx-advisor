import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      buy:  '#16a34a',
      sell: '#dc2626',
      hold: '#d97706'
    },
    fontFamily: {
      arabic: ['Cairo', 'sans-serif']
    }
  }},
  plugins: []
};
export default config;
