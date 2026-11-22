import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // `app/providers` is the conventional FSD segment for app-wide context providers.
    files: ['./src/app/providers/**'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
]);
