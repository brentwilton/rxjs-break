# rxjs-break
RxJS operator breakpoint library

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/brentwilton/rxjs-break/blob/master/LICENSE)
[![NPM version](https://img.shields.io/npm/v/rxjs-break.svg)](https://www.npmjs.com/package/rxjs-break)
[![Downloads](http://img.shields.io/npm/dm/rxjs-break.svg)](https://npmjs.org/package/rxjs-break)

### What is it?

`rxjs-break` is an RxJS library that allows breakpoints to be added directly into the obserable stream. It implements a new BreakpointOperator that passes the values through a callback that can be used as a breakpoint.
Including `rxjs-break` as a webpack loader will automatically wrap all `.pipe(...)` operators with breakpoints.

### Why might you need it?

If you add breakpoint to a RxJS pipeable operator it will hit the breakpoint during creation of the obserable, but not when the pipeable is invoked. This can make pipes hard to debug.

## Install

Install the package using NPM:

```
npm install rxjs-break --save-dev
```

## Usage

`rxjs-break` contains a webpack loader.

**webpack.config.js**

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        use: [
          'rxjs-break',
          // i.e. add rxjs-break as the entry before ts-loader or @ngtools/webpack
          // ...
         ]
      },
    ],
  },
};
```

## Notes

Only operators inside a `.pipe(...)` are patched and `refCount` operator and operators using spread `...` are ignored for now.
