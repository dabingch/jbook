import * as esbuild from 'esbuild-wasm';
import axios from 'axios';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);
        if (args.path === 'index.js') {
          return { path: args.path, namespace: 'a' };
        }

        // Solve relative path
        if (args.path.includes('./') || args.path.includes('../')) {
          return {
            namespace: 'a',
            path: new URL(args.path, `https://unpkg.com${args.resolveDir}/`)
              .href,
          };
        }

        return {
          path: `https://unpkg.com/${args.path}`,
          namespace: 'a',
        };

        // else if (args.path === 'tiny-test-pkg') {
        //   return {
        //     namespace: 'a',
        //     path: `https://unpkg.com/tiny-test-pkg@1.0.0/index.js`,
        //   };
        // }
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              const message = require('nested-test-pkg');
              console.log(message);
            `,
          };
        }

        const { data, request } = await axios.get(args.path);

        // console.log(request);

        return {
          loader: 'jsx',
          contents: data,
          // Resolve nested path
          resolveDir: new URL('./', request.responseURL).pathname,
        };
      });
    },
  };
};
