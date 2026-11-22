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
    // TODO(self-review): re-enable once features and widgets consume the entities.
    // While the app is built bottom-up, freshly added slices have no consumers yet.
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
]);
