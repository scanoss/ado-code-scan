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

import {DependencyTrackService} from "../services/dependency-track.service";
import {RUNTIME_CONTAINER} from "../app.input";
import assert from 'assert';

describe('Dependency track service', () => {
    let dependencyTrackProjectName = 'dependency-track-project-name';
    let dependencyTrackProjectVersion = '1.2.4';
    let dependencyTrackProjectID = 'asttvsd2346gfy';
    let dependencyTrackURL = 'https://dependencytrack.com';
    let dependencyTrackAPIKey = 'tgtresetryokjgvcb';
    beforeEach(() => {
        dependencyTrackProjectName = 'dependency-track-project-name';
        dependencyTrackProjectVersion = '1.2.4';
        dependencyTrackProjectID = 'asttvsd2346gfy';
        dependencyTrackURL = 'https://dependencytrack.com';
        dependencyTrackAPIKey = 'tgtresetryokjgvcb';
    });

    it('should fail due to missing Dependency Track API Key', () => {
        dependencyTrackAPIKey = '';
        const service = new DependencyTrackService({
            enabled: true,
            url: dependencyTrackURL,
            apiKey: dependencyTrackAPIKey,
            projectId: dependencyTrackProjectID,
            projectName: dependencyTrackProjectName,
            projectVersion: dependencyTrackProjectVersion
        });

        assert.throws(() => {
            (service as any).validateConfiguration();
            }, Error,
            'Dependency Track is enabled but required parameters are missing: dependencytrack.apikey'
        );
    });


    it('should fail due to missing project version', () => {
        // Project id has more priority than project version
        dependencyTrackProjectID = '';
        // Set dependency track project version to empty string
        dependencyTrackProjectVersion = '';
        const service = new DependencyTrackService({
            enabled: true,
            url: dependencyTrackURL,
            apiKey: dependencyTrackAPIKey,
            projectId: dependencyTrackProjectID,
            projectName: dependencyTrackProjectName,
            projectVersion: dependencyTrackProjectVersion
        });

        assert.throws(() => {
            (service as any).validateConfiguration();
        }, Error,
            `Dependency Track is enabled but project identification is incomplete. ` +
            `Either provide 'dependencytrack.projectId' OR both 'dependencytrack.projectName' and 'dependencytrack.projectVersion'. ` +
            `Missing: dependencytrack.projectVersion`
        );
    });

    it('should fail due to missing project name', () => {
        // Project id has more priority than project version
        dependencyTrackProjectID = '';
        // Set dependency track project version to empty string
        dependencyTrackProjectName = '';
        const service = new DependencyTrackService({
            enabled: true,
            url: dependencyTrackURL,
            apiKey: dependencyTrackAPIKey,
            projectId: dependencyTrackProjectID,
            projectName: dependencyTrackProjectName,
            projectVersion: dependencyTrackProjectVersion
        });

        assert.throws(() => {
            (service as any).validateConfiguration();
        }, Error,
            `Dependency Track is enabled but project identification is incomplete. ` +
            `Either provide 'dependencytrack.projectId' OR both 'dependencytrack.projectName' and 'dependencytrack.projectVersion'. ` +
            `Missing: dependencytrack.projectName`
        );
    });

    it('should fail due to missing dependency track URL', () => {
        dependencyTrackURL = '';
        const service = new DependencyTrackService({
            enabled: true,
            url: dependencyTrackURL,
            apiKey: dependencyTrackAPIKey,
            projectId: dependencyTrackProjectID,
            projectName: dependencyTrackProjectName,
            projectVersion: dependencyTrackProjectVersion
        });

        assert.throws(() => {
                (service as any).validateConfiguration();
            }, Error,
            'Dependency Track is enabled but required parameters are missing: dependencytrack.url'
        )
    });

    it('should correctly return the scanoss-py Dependency Track upload command', () => {
        const service = new DependencyTrackService({
            enabled: true,
            url: dependencyTrackURL,
            apiKey: dependencyTrackAPIKey,
            projectId: dependencyTrackProjectID,
            projectName: dependencyTrackProjectName,
            projectVersion: dependencyTrackProjectVersion
        });
        const command = (service as any).buildDependencyTrackUploadParameters();
        assert.deepStrictEqual(command, [
            'run',
            '-v',
            ':/scanoss',
            RUNTIME_CONTAINER,
            'export',
            'dependency-track',
            '--input',
            './cyclonedx.json',
            '--dt-apikey',
            dependencyTrackAPIKey,
            '--dt-url',
            dependencyTrackURL,
            '--dt-projectid',
            dependencyTrackProjectID,
            '--dt-projectname',
            dependencyTrackProjectName,
            '--dt-projectversion',
            dependencyTrackProjectVersion
        ]);
    });
});
