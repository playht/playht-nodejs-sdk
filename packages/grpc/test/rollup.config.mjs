/* eslint-disable no-undef */

import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'node:url'

import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import virtual from '@rollup/plugin-virtual'
import {terser} from 'rollup-plugin-terser'

const dir = path.dirname(fileURLToPath(import.meta.url))

const testFiles = fs
    .readdirSync(dir)
    .filter((f) => f.match(/\.ts$/))
    .map((f) => path.join(dir, f))

const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Tests</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/mocha/mocha.css" />
  </head>
  <body>
    <div id="mocha"></div>
    <script src="https://unpkg.com/chai/chai.js"></script>
    <script src="https://unpkg.com/mocha/mocha.js"></script>
    <script class="mocha-init">
      mocha.setup('tdd');
      mocha.checkLeaks();
    </script>
    %%tests%%
    <script class="mocha-exec">
      mocha.run();
    </script>
  </body>
</html>
`

function testBundler() {
    return {
        name: 'Test Bundler',
        generateBundle(opts, bundle) {
            const file = path.basename(opts.file)
            const output = bundle[file]
            delete bundle[file]
            const code = [
                '<script>',
                output.code,
                `//# sourceMappingURL=${output.map.toUrl()}`,
                '//# sourceURL=tests.ts',
                '</script>',
            ].join('\n')
            this.emitFile({
                type: 'asset',
                fileName: file,
                source: template.replace('%%tests%%', code),
            })
        },
    }
}

/** @type {import('rollup').RollupOptions} */
export default [
    {
        input: 'tests',
        output: {
            file: 'test/browser.html',
            format: 'iife',
            sourcemap: true,
            globals: {
                chai: 'chai',
                mocha: 'mocha',
            },
        },
        external: ['chai', 'mocha'],
        plugins: [
            virtual({
                tests: testFiles.map((f) => `import '${f.slice(0, -3)}'`).join('\n'),
            }),
            alias({
                entries: [{find: '$lib', replacement: '../src'}],
            }),
            typescript({target: 'es6', module: 'es2020', tsconfig: './test/tsconfig.json'}),
            resolve({browser: true}),
            commonjs(),
            json(),
            terser({
                mangle: false,
                format: {
                    beautify: true,
                },
                compress: false,
            }),
            testBundler(),
        ],
    },
]
