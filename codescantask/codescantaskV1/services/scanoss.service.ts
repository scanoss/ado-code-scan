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

import * as tl from 'azure-pipelines-task-lib';
import {EXECUTABLE, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER} from "../app.input";
import {CYCLONEDX_FILE_NAME, SPDXLITE_FILE_NAME, CSV_FILE_NAME} from "../app.output";
import fs from 'fs';
import path from "path";

export class ScanOssService {
    /**
     * Build scanoss-py conversion parameters */
    private buildReformatParameters(format: string, filename: string): string[] {
        return [
            'run',
            '-v',
            `${REPO_DIR}:/scanoss`,
            RUNTIME_CONTAINER,
            'convert',
            '--input',
            `./${OUTPUT_FILEPATH}`,
            '--format',
            `${format}`,
            '--output',
            `./${filename}`
        ];
    }

    /**
     * Reformats SCANOSS results using scanoss-py.
     * Currently always generates CycloneDX, SPDXLite and CSV files to be
     * uploaded as an artifact for other integrations.
     */
    async reformatScanResults(format: string): Promise<Error | undefined> {
        try {
            console.log(`Converting SCANOSS results to ${format} format...`);
            const options = {
                failOnStdErr: false,
                ignoreReturnCode: false
            };
            const filename =
                format === 'cyclonedx'
                    ? CYCLONEDX_FILE_NAME
                    : format === 'spdxlite'
                        ? SPDXLITE_FILE_NAME
                        : format === 'csv'
                            ? CSV_FILE_NAME
                            : undefined;
            if (!filename) {
                return new Error(`Unknown format: ${format}`);
            }
            const exitCode = await tl.execAsync(
                EXECUTABLE,
                this.buildReformatParameters(format, filename),
                options
            );
            if (exitCode !== 0) {
                return new Error(`Error converting scan results into ${format} format`);
            }
            // Check if reformatted file was actually created before trying to upload it
            try {
                const formatAbsolutePath = path.join(process.cwd(), filename)
                await fs.promises.access(formatAbsolutePath, fs.constants.F_OK);
                this.uploadToArtifacts(formatAbsolutePath);
                console.log(`Successfully converted results into ${format} format`);
            } catch (fileError) {
                // File doesn't exist - this can happen with empty repos
                console.log(`${format} conversion completed but no file generated (likely empty repository)`);
            }
        } catch (e: any) {
            tl.error(e.message);
        }
    }

    private uploadToArtifacts(pathToFile: string) {
        const artifactName = 'scanoss';
        tl.command('artifact.upload', { artifactname: artifactName }, pathToFile);
    }
}

export const scanossService = new ScanOssService();