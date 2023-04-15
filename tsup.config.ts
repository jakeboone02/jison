import { defineConfig, type Options } from 'tsup';
import fs from 'node:fs/promises';

export default defineConfig(options => {
  const commonOptions: Partial<Options> = {
    entry: {
      jison: 'src/jison.ts',
    },
    sourcemap: true,
    ...options,
  };

  const productionOptions = {
    minify: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  };

  return [
    // ESM, standard bundler dev, embedded `process` references
    {
      ...commonOptions,
      format: 'esm',
      // TODO: enable this when src/jison.ts has fewer TS errors
      // dts: true,
      clean: true,
      sourcemap: true,
    },
    // ESM, Webpack 4 support. Target ES2017 syntax to compile away optional chaining and spreads
    {
      ...commonOptions,
      entry: {
        'jison.legacy-esm': 'src/jison.ts',
      },
      target: 'es2017',
      format: ['esm'],
      sourcemap: true,
    },
    // ESM for use in browsers. Minified, with `process` compiled away
    {
      ...commonOptions,
      ...productionOptions,
      entry: {
        'jison.production': 'src/jison.ts',
      },
      format: 'esm',
    },
    // CJS development
    {
      ...commonOptions,
      entry: {
        'jison.cjs.development': 'src/jison.ts',
      },
      format: 'cjs',
      outDir: './dist/cjs/',
    },
    // CJS production
    {
      ...commonOptions,
      ...productionOptions,
      entry: {
        'jison.cjs.production': 'src/jison.ts',
      },
      format: 'cjs',
      outDir: './dist/cjs/',
      onSuccess: async () => {
        // Write the CJS index file
        await fs.writeFile(
          'dist/cjs/index.js',
          `
'use strict'
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./jison.cjs.production.min.js')
} else {
  module.exports = require('./jison.cjs.development.js')
}`
        );
      },
    },
  ];
});
