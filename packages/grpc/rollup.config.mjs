import fs from 'fs'
import dts from 'rollup-plugin-dts'
import typescript from '@rollup/plugin-typescript'

import pkg from './package.json' assert {type: 'json'}

const name = pkg.name
const license = fs.readFileSync('LICENSE').toString('utf-8').trim()
const banner = `
/**
 * ${name} v${pkg.version}
 * ${pkg.homepage}
 *
 * @license
 * ${license.replace(/\n/g, '\n * ')}
 */
`.trim()

const external = Object.keys(pkg.dependencies)
external.push('protobufjs/minimal')

/** @type {import('rollup').RollupOptions} */
export default [
    {
        input: 'src/index.ts',
        output: {
            banner,
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
        },
        plugins: [typescript({target: 'es6'})],
        external,
    },
    {
        input: 'src/index.ts',
        output: {
            banner,
            file: pkg.module,
            format: 'esm',
            sourcemap: true,
        },
        plugins: [typescript({target: 'es2020'})],
        external,
    },
    {
        input: 'src/index.ts',
        output: {banner, file: pkg.types, format: 'esm'},

        plugins: [dts()],
    },
]
