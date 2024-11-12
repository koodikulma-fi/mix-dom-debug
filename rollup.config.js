
// rollup.config.js
//
// See terser options here: https://github.com/terser/terser#minify-options

import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

// const devMode = (process.env.NODE_ENV === 'development');
// console.log(`${ devMode ? 'development' : 'production' } mode bundle`);

export default [

    // - Declarations - //

    {
        input: 'dist/dts/index.d.ts',
        output: {
          file: 'dist/mix-dom-debug.d.ts',
          format: 'es',
        },
        plugins: [
            dts(),
        ],
    },


    // - Global (= window.MixDOMDebug) - //

    {
        input: 'dist/index_global.js',
        output: {
          file: 'dist/index_global.js', // 'MixDOMDebug.js' // <-- Will be copied there.
          format: 'cjs',
        },
        plugins: [
            resolve(),
            terser({
                ecma: 2015,
                enclose: true,
                mangle: {
                    // module: true,
                    keep_fnames: true,
                    keep_classnames: true,
                },
                compress: {
                    module: true,
                    keep_fnames: true,
                    keep_fargs: true,
                    keep_classnames: true,
                    // unsafe_arrows: true,
                },

                output: { quote_style: 1 },
            }),

        ]
    },


    // - ES Module - //

    {
        // external: ['mixin-types', 'data-signals', 'data-memo', 'dom-types],
        input: 'dist/index.js',
        output: {
            file: 'dist/mix-dom-debug.module.js',
            format: 'es',
        },
        plugins: [
            terser({
                ecma: 2015,
                mangle: {
                    // module: true,
                    keep_fnames: true,
                    keep_classnames: true,
                },
                compress: {
                    module: true,
                    keep_fnames: true,
                    keep_fargs: true,
                    keep_classnames: true,
                    // unsafe_arrows: true,
                },
                output: { quote_style: 1 }
            }),
        ],
    },


    // - CJS - //

    {
        // external: ['mixin-types', 'data-signals', 'data-memo', 'dom-types],
        input: 'dist/index_cjs.js',
        output: {
            file: 'dist/mix-dom-debug.js',
            format: 'cjs',
            exports: "auto"
        },
        plugins: [
            terser({
                ecma: 2015,
                mangle: {
                    // module: true,
                    keep_fnames: true,
                    keep_classnames: true,
                },
                compress: {
                    module: true,
                    keep_fnames: true,
                    keep_fargs: true,
                    keep_classnames: true,
                    // unsafe_arrows: true,
                },
                output: { quote_style: 1 }
            }),

            copy({ targets: [ {
                src: 'dist/index_global.js',
                dest: 'dist',
                rename: 'MixDOMDebug.js',
                transform: (contents, filename) => "if(!window[\"exports\"])window.exports={};" + contents.toString()
            } ], hook: 'buildEnd' }),

        ],
    },


    // - Launcher (declarations) - //

    {
        input: 'dist/dts/index_launcher.d.ts',
        output: {
          file: 'dist/launcher.d.ts',
          format: 'es',
        },
        plugins: [
            dts(),
        ],
    },

    // - Launcher (global) - //

    {
        input: 'dist/index_launcher_global.js',
        output: {
            file: 'dist/launcher.global.js',
            format: 'cjs'
        },
        plugins: [
            // resolve(),
            terser({
                ecma: 2015,
                mangle: {
                    // module: true,
                    keep_fnames: true,
                    keep_classnames: true,
                },
                compress: {
                    module: true,
                    keep_fnames: true,
                    keep_fargs: true,
                    keep_classnames: true,
                    // unsafe_arrows: true,
                },
                output: { quote_style: 1 }
            }),

            // - Clean up - //

            // copy({ targets: [ {
            //     src: 'dist/launcher.js',
            //     dest: 'dist',
            //     rename: 'launcher.js',
            //     transform: (contents, filename) => "if(!window[\"exports\"])window.exports={};" + contents.toString()
            // } ], hook: 'buildEnd' }),

        ],
    },


    // - Launcher (module) - //

    {
        input: 'dist/index_launcher.js',
        output: {
            file: 'dist/launcher.module.js',
            format: 'es'
        },
        plugins: [
            terser({
                ecma: 2015,
                mangle: {
                    // module: true,
                    keep_fnames: true,
                    keep_classnames: true,
                },
                compress: {
                    module: true,
                    keep_fnames: true,
                    keep_fargs: true,
                    keep_classnames: true,
                    // unsafe_arrows: true,
                },
                output: { quote_style: 1 }
            }),
        ],
    },

    // - Launcher (cjs) - //

    {
        input: 'dist/index_launcher_cjs.js',
        output: {
            file: 'dist/launcher.js',
            format: 'cjs',
            exports: "auto"
        },
        plugins: [
            terser({
                ecma: 2015,
                mangle: {
                    // module: true,
                    keep_fnames: true,
                    keep_classnames: true,
                },
                compress: {
                    module: true,
                    keep_fnames: true,
                    keep_fargs: true,
                    keep_classnames: true,
                    // unsafe_arrows: true,
                },
                output: { quote_style: 1 }
            }),

            
            // - Clean up - //

            // copy({ targets: [ {
            //     src: 'dist/launcher.js',
            //     dest: 'dist',
            //     rename: 'launcher.js',
            //     transform: (contents, filename) => "if(!window[\"exports\"])window.exports={};" + contents.toString()
            // } ], hook: 'buildEnd' }),

            del({ targets: ['dist/dts*', 'dist/classes*', 'dist/common*', 'dist/ui*', 'dist/launcher', 'dist/launcher/*', 'dist/index.js', 'dist/index_*.js', 'dist/shared.js'], hook: 'buildEnd' })

        ],
    },

];
