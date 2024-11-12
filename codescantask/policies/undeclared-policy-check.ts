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

import { PolicyCheck } from './policy-check';
import {OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER } from '../app.input';
import * as tl from 'azure-pipelines-task-lib';

/**
 * Verifies that all components identified in scanner results are declared in the project's SBOM.
 * The run method compares components found by the scanner against those declared in the SBOM.
 *
 * It identifies and reports undeclared components, generating a summary and detailed report of the findings.
 *
 */
export class UndeclaredPolicyCheck extends PolicyCheck {
    private policyCheckResultName = 'policy-check-undeclared-results.md';
    constructor() {
        super(`Undeclared Policy`);
    }


    private buildCommand(): string {
        return `docker run -v "${REPO_DIR}:/scanoss" ${RUNTIME_CONTAINER} inspect undeclared --input ${OUTPUT_FILEPATH}  --format md`;
    }

    private getResults(details: string, summary:string) {
        return `${details}\n${summary}`;
    }

    async run(): Promise<void> {
        await this.start();

        const dockerCommand = this.buildCommand();

        console.log(`Executing Docker command: ${dockerCommand}`);
        const results = tl.execSync('bash', ['-c', dockerCommand]);

        if (results.code === 1) {
            await this.success('### :white_check_mark: Policy Pass \n #### Not undeclared components were found', undefined);
            return;
        }
        const undeclaredComponentsResults = this.getResults(results.stdout,results.stderr);
        await this.uploadArtifact(this.policyCheckResultName, undeclaredComponentsResults);
        await this.reject(results.stderr, undeclaredComponentsResults);
    }
}