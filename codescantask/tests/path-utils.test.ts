// SPDX-License-Identifier: MIT
/*
   Copyright (c) 2026, SCANOSS

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
 */

import assert from 'assert';
import { validateScanPath } from '../utils/path.utils';

describe('validateScanPath', function () {

    it('should return "." for undefined input', function () {
        assert.strictEqual(validateScanPath(undefined), '.');
    });

    it('should return "." for empty string input', function () {
        assert.strictEqual(validateScanPath(''), '.');
    });

    it('should accept valid relative paths', function () {
        assert.strictEqual(validateScanPath('src'), 'src');
        assert.strictEqual(validateScanPath('packages/api'), 'packages/api');
        assert.strictEqual(validateScanPath('src-v2/api_server'), 'src-v2/api_server');
    });

    it('should strip leading "./" for consistency', function () {
        assert.strictEqual(validateScanPath('./src'), 'src');
        assert.strictEqual(validateScanPath('./packages/api'), 'packages/api');
    });

    it('should reject absolute Unix paths', function () {
        assert.strictEqual(validateScanPath('/etc/passwd'), '.');
        assert.strictEqual(validateScanPath('/usr/local/bin'), '.');
    });

    it('should reject absolute Windows paths', function () {
        assert.strictEqual(validateScanPath('C:\\Windows\\System32'), '.');
        assert.strictEqual(validateScanPath('D:\\Projects'), '.');
    });

    it('should reject parent directory traversal', function () {
        assert.strictEqual(validateScanPath('..'), '.');
        assert.strictEqual(validateScanPath('../../../etc'), '.');
        assert.strictEqual(validateScanPath('src/../../etc'), '.');
    });

    it('should return "." for "." input', function () {
        assert.strictEqual(validateScanPath('.'), '.');
    });
});