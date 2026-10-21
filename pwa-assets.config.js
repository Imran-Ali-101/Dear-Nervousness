import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates all PWA icons (192, 512, maskable, apple-touch) from the logo
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});