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


import {
    DEPENDENCY_TRACK_API_KEY,
    DEPENDENCY_TRACK_ENABLED,
    DEPENDENCY_TRACK_PROJECT_ID, DEPENDENCY_TRACK_PROJECT_NAME, DEPENDENCY_TRACK_PROJECT_VERSION,
    DEPENDENCY_TRACK_URL, EXECUTABLE, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER
} from "../app.input";
import * as tl from "azure-pipelines-task-lib";
import fs from "fs";
import {CYCLONEDX_FILE_NAME} from "../app.output";
import path from "path";

export interface DependencyTrackOptions {
    enabled: boolean;
    url: string | undefined;
    apiKey: string | undefined;
    projectId: string | undefined;
    projectName: string | undefined;
    projectVersion: string | undefined;
}

export class DependencyTrackService {
    private options: DependencyTrackOptions;

    constructor(options?: DependencyTrackOptions) {
        this.options = options || {
            enabled: DEPENDENCY_TRACK_ENABLED,
            url: DEPENDENCY_TRACK_URL,
            apiKey: DEPENDENCY_TRACK_API_KEY,
            projectId: DEPENDENCY_TRACK_PROJECT_ID,
            projectName: DEPENDENCY_TRACK_PROJECT_NAME,
            projectVersion: DEPENDENCY_TRACK_PROJECT_VERSION
        };
    }

    /**
     * Validates that all required Dependency Track parameters are provided
     */
    private validateConfiguration(): void {
        const missingParams: string[] = [];

        // Check required parameters
        if (!this.options.url) missingParams.push('dependencytrackUrl');
        if (!this.options.apiKey) missingParams.push('dependencytrackAPIKey');

        if (missingParams.length > 0) {
            throw new Error(`Dependency Track is enabled but required parameters are missing: ${missingParams.join(', ')}`);
        }

        // Check project identification - must have either projectId OR (projectName + projectVersion)
        if (!this.options.projectId) {
            const missingProjectParams: string[] = [];

            if (!this.options.projectName) missingProjectParams.push('dependencytrackProjectName');
            if (!this.options.projectVersion) missingProjectParams.push('dependencytrackProjectVersion');

            if (missingProjectParams.length > 0) {
                throw new Error(
                    `Dependency Track is enabled but project identification is incomplete. ` +
                    `Either provide 'dependencytrack.projectId' OR both 'dependencytrackProjectName' and 'dependencytrackProjectVersion'. ` +
                    `Missing: ${missingProjectParams.join(', ')}`
                );
            }
        }
    }

    /**
     * Converts SCANOSS results to CycloneDX format and uploads to Dependency Track
     */
    async uploadToDependencyTrack(): Promise<void> {
        try {
            if (!this.options.enabled) {
                tl.debug(`Dependency Track upload is disabled`);
                return;
            }
            this.validateConfiguration();

            // Check if CycloneDX file exists
            await fs.promises.readFile(path.join(tl.getVariable('Build.Repository.LocalPath') || '' , CYCLONEDX_FILE_NAME), 'utf8');

            tl.debug('Starting Dependency Track upload process...');
            await this.uploadCycloneDXToDependencyTrack();
        } catch (e: any) {
            tl.error(e.message);
        }
    }

    /**
     * Build scanoss-py dependency track upload parameters */
    private buildDependencyTrackUploadParameters(): string[] {
        const args = [
            'run',
            '-v',
            `${REPO_DIR}:/scanoss`,
            RUNTIME_CONTAINER,
            'export',
            'dependency-track',
            '--input',
            `./${CYCLONEDX_FILE_NAME}`,
            ...(this.options.apiKey ? ['--dt-apikey', this.options.apiKey] : []),
            ...(this.options.url ? ['--dt-url', this.options.url] : []),
            ...(this.options.projectId ? ['--dt-projectid', this.options.projectId] : []),
            ...(this.options.projectName ? ['--dt-projectname', this.options.projectName] : []),
            ...(this.options.projectVersion ? ['--dt-projectversion', this.options.projectVersion] : [])
        ];
        return args;
    }

    /**
     * Upload CycloneDX file to Dependency Track using scanoss-py
     */
    private async uploadCycloneDXToDependencyTrack(): Promise<Error | undefined> {
        const options = {
            failOnStdErr: false,
            ignoreReturnCode: false
        };

        const exitCode = await tl.execAsync(
            EXECUTABLE,
            this.buildDependencyTrackUploadParameters(),
            options
        );
        if (exitCode != 0) {
            return new Error(`Error uploading CycloneDX to Dependency Track: ${exitCode}`);
        }
        tl.debug('CycloneDX successfully uploaded to Dependency Track');
    }
}

export const dependencyTrackService = new DependencyTrackService();
