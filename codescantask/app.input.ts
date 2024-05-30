// SPDX-License-Identifier: MIT
/*
   Copyright (c) 2024, SCANOSS

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

import tl = require('azure-pipelines-task-lib/task');
export const DEPENDENCIES_ENABLED = tl.getInput('dependenciesEnabled') === 'true';
export const API_KEY = tl.getInput('apiKey');
export const API_URL = tl.getInput('apiUrl');
export const OUTPUT_FILEPATH = tl.getInput('outputFilepath') || "results.json";
export const REPO_DIR = tl.getVariable('Build.Repository.LocalPath') || ''; // Get repository path
export const SBOM_ENABLED = tl.getInput('sbomEnabled') === 'true';
export const SBOM_FILEPATH = tl.getInput('sbomFilepath');
export const SBOM_TYPE = tl.getInput('sbomType');
export const POLICIES_HALT_ON_FAILURE = tl.getInput('policiesHaltOnFailure') === 'true';
export const RUNTIME_CONTAINER = tl.getInput('runtimeContainer') || "ghcr.io/scanoss/scanoss-py:v1.9.0";
