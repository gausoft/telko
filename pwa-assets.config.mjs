import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icons are generated from a full-bleed square so Android masks and iOS corners never crop the keypad.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#4B3BFF' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#4B3BFF' } },
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
  },
  images: ['assets/app-icon.svg'],
});
