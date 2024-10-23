import type { Config } from 'tailwindcss'

// each package is responsible for its own `content` as directories & file extensions may differ.
const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
