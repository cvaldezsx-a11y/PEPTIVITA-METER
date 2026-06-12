import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep':    '#0D1117',
        'bg-surface': '#161B22',
        'bg-card':    '#21262D',
        'cyan':       '#00C8FF',
        'green':      '#00E5A0',
        'amber':      '#FFB547',
        'danger':     '#FF5C6B',
        'purple':     '#B48EF5',
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        title: ['DM Sans', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
