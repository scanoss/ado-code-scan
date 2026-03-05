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

import path = require('path');

/**
 * Validates a scan path to prevent directory traversal and ensure safe operations.
 * @param scanPath - The scan path to validate
 * @returns A safe scan path or defaults to current directory
 */
export function validateScanPath(scanPath: string | undefined): string {
    if (!scanPath) {
        return '.';
    }

    // Normalize and convert to forward slashes for consistency
    const normalizedPath = path.normalize(scanPath).replace(/\\/g, '/');

    // Reject absolute paths (Unix-style and Windows-style)
    const windowsAbsolutePattern = /^[a-zA-Z]:/;
    if (path.isAbsolute(scanPath) || windowsAbsolutePattern.test(normalizedPath)) {
        console.warn(`Absolute scan paths not allowed: ${scanPath}. Using default: .`);
        return '.';
    }

    // Reject directory traversal attempts
    if (normalizedPath.includes('..')) {
        console.warn(`Invalid scan path detected: "${scanPath}". Using default: .`);
        return '.';
    }

    // Remove leading './' for consistency
    const cleaned = normalizedPath.startsWith('./') ? normalizedPath.slice(2) : normalizedPath;

    return cleaned || '.';
}