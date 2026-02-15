import esbuild from 'esbuild';
import path from 'path';

import { baseBrowserBuildConfig, basePlugins, cleanDistSync } from 'shared-for-build';

const production = process.env.MODE === 'production';
const distDir = path.resolve(__dirname, 'dist');
const srcDir = path.resolve(__dirname, 'src');
const tsconfig = path.resolve(__dirname, production ? 'tsconfig.json' : 'tsconfig.dev.json');

cleanDistSync(production, distDir);

const plugins: esbuild.Plugin[] = [
  ...basePlugins({
    production,
    src: srcDir,
    out: distDir,
    tsconfig
  }),
];

const buildOptions: esbuild.BuildOptions = {
  ...baseBrowserBuildConfig,
  entryPoints: [path.resolve(srcDir, 'index.ts')],
  sourcemap: !production,
  minify: production,
  outfile: path.resolve(distDir, 'index.js'),
  plugins
};

(async (isProduction: boolean) => {
  try {
    if (isProduction) {
      await esbuild.build(buildOptions);
      console.log('🚀 Build completed');
      return;
    }
    
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch({ delay: 70 });
    console.log('👀 Watching for changes...');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
})(production);
