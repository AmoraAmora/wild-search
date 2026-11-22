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
  {
    // The app has a single page, so every slice inevitably has exactly one consumer and
    // this rule would collapse everything into `pages/home`. The download features are
    // kept as independent slices on purpose: they don't depend on the modal and can be
    // reused as is (e.g. on a product page).
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
]);
