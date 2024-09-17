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

import * as tl from 'azure-pipelines-task-lib/task';
import * as fs from 'fs';
import {
    API_KEY,
    API_URL,
    DEPENDENCIES_ENABLED, DEPENDENCIES_SCOPE, DEPENDENCY_SCOPE_EXCLUDE, DEPENDENCY_SCOPE_INCLUDE,
    OUTPUT_FILEPATH,
    REPO_DIR, RUNTIME_CONTAINER,
    SBOM_ENABLED,
    SBOM_FILEPATH, SBOM_TYPE
} from '../app.input';
import { ScannerResults } from './result.interface';
import path from 'path';
export interface Options {
    /**
     * Whether SBOM ingestion is enabled. Optional.
     */
    sbomEnabled?: boolean;

    /**
     * Specifies the SBOM processing type: "identify" or "ignore". Optional.
     */
    sbomType?: string;

    /**
     * Absolute path to the SBOM file. Required if sbomEnabled is set to true.
     */
    sbomFilepath?: string;

    /**
     * Enables scanning for dependencies, utilizing scancode internally. Optional.
     */
    dependenciesEnabled?: boolean;

    /**
     * Gets dependencies with production scopes. optional
     */
    dependencyScope?: string;

    /**
     * List of custom dependency scopes to be included. optional
     */
    dependencyScopeInclude?: string;

    /**
     * List of custom dependency scopes to be excluded. optional
     */
    dependencyScopeExclude?: string;

    /**
     * Credentials for SCANOSS, enabling unlimited scans. Optional.
     */
    apiKey?: string;
    apiUrl?: string;

    /**
     * Absolute path where scan results are saved. Required.
     */
    outputFilepath: string;

    /**
     * Absolute path of the folder or file to scan. Required.
     */
    inputFilepath: string;

    /**
     * Runtime container to perform scan. Default [ghcr.io/scanoss/scanoss-py:v1.9.0]
     */
    runtimeContainer: string;

}
export class ScanService {
    private options: Options;
    constructor(options?: Options) {
        this.options = options || {
            apiKey: API_KEY,
            apiUrl: API_URL,
            sbomEnabled: SBOM_ENABLED,
            sbomFilepath: SBOM_FILEPATH,
            sbomType: SBOM_TYPE,
            dependenciesEnabled: DEPENDENCIES_ENABLED,
            outputFilepath: path.join(tl.getVariable('Build.Repository.LocalPath') || '' , OUTPUT_FILEPATH),
            inputFilepath: REPO_DIR,
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScope: DEPENDENCIES_SCOPE,
            dependencyScopeExclude: DEPENDENCY_SCOPE_EXCLUDE,
            dependencyScopeInclude: DEPENDENCY_SCOPE_INCLUDE
        };
    }
    async scan(): Promise<ScannerResults> {
        try {
            const dockerCommand = await this.buildCommand();
            console.log(`Executing Docker command: ${dockerCommand}`);

            const options = {
                failOnStdErr: false,
                ignoreReturnCode: true,
            };
            const resultCode = await tl.execAsync('bash', ['-c', dockerCommand], options);

            if (resultCode !== 0) {
                console.error(`Error: Docker command failed with exit code ${resultCode}`);
                tl.setResult(tl.TaskResult.Failed, 'Docker command failed');
            }
            console.log('Docker command executed successfully');
            this.uploadResultsToArtifacts();
            return this.parseResult();


        } catch (error: any) {
            console.error('Error:', error);
            tl.setResult(tl.TaskResult.Failed, error.message);
            throw error;
        }
    }

    private dependencyScopeCommand(): string {
        const { dependencyScopeInclude, dependencyScopeExclude, dependencyScope } = this.options;

        // Count the number of non-empty values
        const setScopes = [dependencyScopeInclude, dependencyScopeExclude, dependencyScope].filter(
            scope => scope !== '' && scope !== undefined
        );

        if (setScopes.length > 1) {
            tl.setResult(tl.TaskResult.Failed, 'Only one dependency scope filter can be set');
        }

        if (dependencyScopeExclude && dependencyScopeExclude !== '') return `--dep-scope-exc ${this.options.dependencyScopeExclude}`;

        if (dependencyScopeInclude && dependencyScopeInclude !== '') return `--dep-scope-inc ${this.options.dependencyScopeInclude}`;

        if (dependencyScope && dependencyScope === 'prod') return '--dep-scope prod';

        if (dependencyScope && dependencyScope === 'dev') return '--dep-scope dev';

        return '';
    }


    private async buildCommand(): Promise<string> {
       return `docker run -v "${this.options.inputFilepath}":"/scanoss" ${this.options.runtimeContainer} scan . --output ./${OUTPUT_FILEPATH} ${this.options.dependenciesEnabled ? `--dependencies` : ''} ${this.dependencyScopeCommand()} ${await this.detectSBOM()}  ${this.options.apiUrl ? `--apiurl ${this.options.apiUrl}` : ''} ${this.options.apiKey ? `--key ${this.options.apiKey}` : ''}`.replace(/\n/gm, ' ');
    }

    private uploadResultsToArtifacts(){
        const artifactName = 'scanoss';
        tl.command('artifact.upload', { artifactname: artifactName }, this.options.outputFilepath);
    }

    /**
     * Constructs the command segment for SBOM ingestion based on the current configuration. This method checks if SBOM
     * ingestion is enabled and verifies the SBOM file's existence before constructing the command.
     *
     * @example
     * // When SBOM ingestion is enabled with a specified SBOM file and type:
     * // sbomEnabled = true, sbomFilepath = "/src/SBOM.json", sbomType = "identify"
     * // returns "--identify /src/SBOM.json"
     *
     * @returns A command string segment for SBOM ingestion or an empty string if conditions are not met.
     * @private
     */
    private async detectSBOM(): Promise<string> {
        if (!this.options.sbomEnabled || !this.options.sbomFilepath) return '';

        try {
            await fs.promises.access(this.options.sbomFilepath, fs.constants.F_OK);
            return `--${this.options.sbomType?.toLowerCase()} ${this.options.sbomFilepath}`;
        } catch (error:any) {
            tl.setResult(tl.TaskResult.Failed, error.message);
            return '';
        }
    }

    private async parseResult(): Promise<ScannerResults> {
        const content = await fs.promises.readFile(this.options.outputFilepath, 'utf-8');
        return JSON.parse(content) as ScannerResults;
    }
}