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
import { ScanService } from './services/scan.service';
import { scanossService } from "./services/scanoss.service";
import { policyManager } from './policies/policy.manager';
import { DependencyTrackService } from './services/dependency-track.service';
import { DependencyTrackStatusService } from './services/dependency-track-status.service';
import { DepTrackPolicyCheck } from './policies/dep-track-policy-check';
import {DEPENDENCY_TRACK_ENABLED, setDependencyTrackProjectId, setDependencyTrackUploadToken} from "./app.input";

async function run() {
    try {
            console.log("Starting scan");
            const scanService = new ScanService();
            await scanService.scan();
            const policies = policyManager.getPolicies();

        // Convert raw result to CycloneDX, SPDXLite and CSV
        const formats = ['cyclonedx', 'spdxlite', 'csv'];
        for (const format of formats) {
            await scanossService.reformatScanResults(format);
        }

        // Dependency Track Upload
        let uploadAttempted = false;
        if (DEPENDENCY_TRACK_ENABLED) {
            const dtService = new DependencyTrackService();
            const uploadResult = await dtService.uploadToDependencyTrack();
            const dtStatusService = new DependencyTrackStatusService();
            await dtStatusService.reportUploadStatus(uploadResult);
            // Set flag for policy check to know upload was attempted
            uploadAttempted = uploadResult.enabled;
            if (uploadResult.success && uploadResult.uploadToken && uploadResult.projectId) {
                // Store upload token and project ID for policy check
                setDependencyTrackUploadToken(uploadResult.uploadToken);
                setDependencyTrackProjectId(uploadResult.projectId);
            }
        }

        // Run policies
        for (const policy of policies) {
            // If this is a Dependency Track policy, set the upload attempted flag
            if (policy instanceof DepTrackPolicyCheck) {
                policy.setUploadAttempted(uploadAttempted);
            }
            await policy.run();
        }

    } catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
run().catch((err) => {
    tl.setResult(tl.TaskResult.Failed, err.message || 'Unknown error occurred');
    process.exit(1);
});
