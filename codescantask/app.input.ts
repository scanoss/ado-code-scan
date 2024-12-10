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
export const DEPENDENCIES_SCOPE = tl.getInput('dependenciesScope');
export const DEPENDENCY_SCOPE_EXCLUDE = tl.getInput('dependenciesScopeExclude');
export const DEPENDENCY_SCOPE_INCLUDE = tl.getInput('dependenciesScopeInclude');
export const COPYLEFT_LICENSE_INCLUDE = tl.getInput('licensesCopyleftInclude');
export const COPYLEFT_LICENSE_EXCLUDE = tl.getInput('licensesCopyleftExclude');
export const COPYLEFT_LICENSE_EXPLICIT = tl.getInput('licensesCopyleftExplicit');
export const API_KEY = tl.getInput('apiKey');
export const API_URL = tl.getInput('apiUrl');
export const OUTPUT_FILEPATH = tl.getInput('outputFilepath') || "results.json";
export const REPO_DIR = tl.getVariable('Build.Repository.LocalPath') || ''; // Get repository path
export const SBOM_ENABLED = tl.getInput('sbomEnabled') === 'true';
export const SBOM_FILEPATH = tl.getInput('sbomFilepath') || "sbom.json" ;
export const SBOM_TYPE = tl.getInput('sbomType');
export const POLICIES_HALT_ON_FAILURE = tl.getInput('policiesHaltOnFailure') === 'true';
export const RUNTIME_CONTAINER = tl.getInput('runtimeContainer') || "ghcr.io/scanoss/scanoss-py:v1.15.0";
export const SKIP_SNIPPETS = tl.getInput('skipSnippets') === 'true';
export const SCAN_FILES = tl.getInput('scanFiles') === 'true';
export const SCANOSS_SETTINGS = tl.getInput('scanossSettings') === 'false';
export const SETTINGS_FILE_PATH = tl.getInput('settingsFilepath') || 'scanoss.json';