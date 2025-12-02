import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { loadEnv } from 'vite';

export default defineConfig(() => {
  return {
    test: {
      globals: true,
      root: './',
      env: {
        ...loadEnv('test', process.cwd(), ''),
      },
      setupFiles: ['./vitest.setup.ts'],
    },
    plugins: [
      // This is required to build the test files with SWC
      swc.vite(),
      tsconfigPaths(),
    ],
  };
});
