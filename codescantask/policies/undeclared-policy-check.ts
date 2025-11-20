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
import {DEBUG, EXECUTABLE, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER, SCANOSS_SETTINGS} from '../app.input';
import * as tl from 'azure-pipelines-task-lib';
import * as fs from 'fs';
import * as path from 'path';

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


    private buildArgs(): Array<string> {
        return ['run', '-v', `${REPO_DIR}:/scanoss`, RUNTIME_CONTAINER, 'inspect', 'undeclared', '--input',
            OUTPUT_FILEPATH,
            '--format',
            'md',
            '--output',
            'undeclared-details.md',
            '--status',
            'undeclared-summary.md',
            ...(!SCANOSS_SETTINGS ? ['--sbom-format', 'legacy']: []), // Sets sbom format output to legacy if SCANOSS_SETTINGS is not true
            ...(DEBUG ? ['--debug'] : [])
        ];
    }

    private async getDetails(detailsFile: string) {
        const detailsPath = path.join(REPO_DIR, detailsFile);
        tl.debug(`Reading copyleft details from ${detailsPath}`);
        return  fs.promises.readFile(detailsPath, 'utf-8');
    }

    private async getSummary(summaryFile:string) {
        const summaryPath = path.join(REPO_DIR, summaryFile);
        tl.debug(`Reading copyleft summary from ${summaryPath}`);
        return  fs.promises.readFile(summaryPath, 'utf-8');
    }

    async run(): Promise<void> {
        await this.start();

        const args = this.buildArgs();

        tl.debug(`Executing Docker command: ${args}`);
        const results = tl.execSync(EXECUTABLE, args);

        if (results.code === 0) {
            await this.success('### :white_check_mark: Policy Pass \n #### Not undeclared components were found', undefined);
            return;
        }

        // Another exit error is not related to undeclared components
        if(results.code === 1) {
            tl.setResult(tl.TaskResult.Failed, "Undeclared component policy failed: See logs for more details.");
            return;
        }

        const detailsResults = await this.getDetails('undeclared-details.md');
        const summaryResults = await this.getSummary('undeclared-summary.md');
        const combinedResults = `${detailsResults}\n${summaryResults}`;
        await this.uploadArtifact(this.policyCheckResultName, combinedResults);
        await this.reject(results.stderr, combinedResults);
    }
}