// SPDX-License-Identifier: MIT
/*
   Copyright (c) 2025, SCANOSS

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

import * as tl from "azure-pipelines-task-lib";
import {EXECUTABLE, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER} from "../app.input";
import {CYCLONEDX_FILE_NAME} from "../app.output";
import {adoService} from "./ado.service";

export class ScanOssService {
    /**
     * Build scanoss-py CycloneDX conversion parameters */
    private buildCycloneDXParameters(): string[] {
        const args = [
            'run',
            '-v',
            `${REPO_DIR}:/scanoss`,
            RUNTIME_CONTAINER,
            'convert',
            '--input',
            `./${OUTPUT_FILEPATH}`,
            '--format',
            'cyclonedx',
            '--output',
            `./${CYCLONEDX_FILE_NAME}`
        ];
        return args;
    }

    /**
     * Converts SCANOSS results to CycloneDX format using scanoss-py
     */
    async scanResultsToCycloneDX(): Promise<Error | undefined> {
        try {
            tl.debug('Converting SCANOSS results to CycloneDX format...');
            const options = {
                failOnStdErr: false,
                ignoreReturnCode: false
            };
            const exitCode  = await tl.execAsync(EXECUTABLE, this.buildCycloneDXParameters(), options);
            if (exitCode !== 0) {
                return new Error(`Error converting scan results into CycloneDX format`);
            }
            await adoService.uploadArtifact(CYCLONEDX_FILE_NAME);
            tl.debug('Successfully converted results into CycloneDX format');
        } catch (e: any) {
            tl.error(e.message);
        }
    }
}

export const scanossService = new ScanOssService();

