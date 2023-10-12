'use strict';

var assert = require('assert');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var assert__namespace = /*#__PURE__*/_interopNamespace(assert);

const pluralFiles = { size: 'files', 1: 'file' };
const pluralFolders = { size: 'folders', 1: 'folder' };
const pluralSymlinks = { size: 'symlinks', 1: 'symlink' };
const pluralErrors = { size: 'errors', 1: 'error' };
const pluralOthers = { size: 'others', 1: 'other' };
const pluralEntries = { size: 'entries', 1: 'entry' };
const pluralBytes = { size: 'Bytes', 1: 'Byte' };

const { floor, log, pow } = Math;
const byteUnits = [pluralBytes.size, 'KB', 'MB', 'GB', 'TB', 'PB'];
const KB = 1024;
const logKB = log(KB);
function formatAmount(value, units) {
    return `${value} ${units[value] || units.size}`;
}
function formatFileSize(size) {
    const bytes = formatAmount(size, pluralBytes);
    if (size < KB)
        return bytes;
    let i = floor(log(size) / logKB);
    if (!byteUnits[i])
        i = byteUnits.length - 1;
    return `${parseFloat((size / pow(KB, i)).toFixed(2))} ${byteUnits[i]} (${bytes})`;
}
function formatDate(date) {
    return `${date.getFullYear()}-${formatDigit(date.getMonth() + 1)}-${formatDigit(date.getDate())} ${date.getHours()}:${formatDigit(date.getMinutes())}:${formatDigit(date.getSeconds())}`;
}
function formatList(values) {
    const length = values.length;
    return length > 2 ? `${values.slice(0, -1).join(', ')} and ${values[length - 1]}` : values.join(' and ');
}
function formatDigit(digit) {
    return `${digit}`.padStart(2, '0');
}

describe('formats', () => {
    describe(`.${formatAmount.name}()`, () => {
        function runTests(tests, measure) {
            for (const test of tests) {
                it(test.desc, () => assert__namespace.equal(formatAmount(test.expect, measure), test.toBe));
            }
        }
        describe('Pixel', () => {
            runTests([
                {
                    desc: '0 px',
                    expect: 0,
                    toBe: '0 px',
                },
                {
                    desc: '1 px',
                    expect: 1,
                    toBe: '1 px',
                },
                {
                    desc: '2 px',
                    expect: 2,
                    toBe: '2 px',
                },
                {
                    desc: '3 px',
                    expect: 3,
                    toBe: '3 px',
                },
            ], {
                size: 'px',
            });
        });
        describe('Bytes', () => {
            runTests([
                {
                    desc: '0 Bytes',
                    expect: 0,
                    toBe: '0 Bytes',
                },
                {
                    desc: '1 Byte',
                    expect: 1,
                    toBe: '1 Byte',
                },
                {
                    desc: '2 Bytes',
                    expect: 2,
                    toBe: '2 Bytes',
                },
            ], {
                size: 'Bytes',
                1: 'Byte',
            });
        });
    });
    describe(`.${formatFileSize.name}()`, () => {
        function runTests(tests) {
            for (const test of tests) {
                it(test.desc, () => assert__namespace.equal(formatFileSize(test.expect), test.toBe));
            }
        }
        describe('Bytes', () => {
            runTests([
                {
                    desc: '0 Bytes',
                    expect: 0,
                    toBe: '0 Bytes',
                },
                {
                    desc: '1 Byte',
                    expect: 1,
                    toBe: '1 Byte',
                },
                {
                    desc: '2 Bytes',
                    expect: 2,
                    toBe: '2 Bytes',
                },
                {
                    desc: '3 Bytes',
                    expect: 3,
                    toBe: '3 Bytes',
                },
                {
                    desc: '1023 Bytes',
                    expect: 1023,
                    toBe: '1023 Bytes',
                },
            ]);
        });
        describe('KBytes', () => {
            runTests([
                {
                    desc: '1 KB (1024 Bytes)',
                    expect: 1024,
                    toBe: '1 KB (1024 Bytes)',
                },
                {
                    desc: '1024 KB (1048575 Bytes)',
                    expect: 1048575,
                    toBe: '1024 KB (1048575 Bytes)',
                },
            ]);
        });
        describe('MBytes', () => {
            runTests([
                {
                    desc: '1 MB (1048576 Bytes)',
                    expect: 1048576,
                    toBe: '1 MB (1048576 Bytes)',
                },
                {
                    desc: '1.04 MB (1088576 Bytes)',
                    expect: 1088576,
                    toBe: '1.04 MB (1088576 Bytes)',
                },
                {
                    desc: '1024 MB (1073741823 Bytes)',
                    expect: 1073741823,
                    toBe: '1024 MB (1073741823 Bytes)',
                },
            ]);
        });
        describe('GBytes', () => {
            runTests([
                {
                    desc: '1 GB (1073741824 Bytes)',
                    expect: 1073741824,
                    toBe: '1 GB (1073741824 Bytes)',
                },
                {
                    desc: '1024 GB (1099511627775 Bytes)',
                    expect: 1099511627775,
                    toBe: '1024 GB (1099511627775 Bytes)',
                },
            ]);
        });
        describe('TBytes', () => {
            runTests([
                {
                    desc: '1 TB (1099511627776 Bytes)',
                    expect: 1099511627776,
                    toBe: '1 TB (1099511627776 Bytes)',
                },
                {
                    desc: '1 PB (1125899906842623 Bytes)',
                    expect: 1125899906842623,
                    toBe: '1 PB (1125899906842623 Bytes)',
                },
            ]);
        });
        describe('PBytes', () => {
            runTests([
                {
                    desc: '1 PB (1125899906842624 Bytes)',
                    expect: 1125899906842624,
                    toBe: '1 PB (1125899906842624 Bytes)',
                },
                {
                    desc: '1024 PB (1152921504606847000 Bytes)',
                    expect: 1152921504606846999,
                    toBe: '1024 PB (1152921504606847000 Bytes)',
                },
                {
                    desc: '1024 PB (1152921504606847000 Bytes)',
                    expect: 1152921504606847000,
                    toBe: '1024 PB (1152921504606847000 Bytes)',
                },
            ]);
        });
    });
});
