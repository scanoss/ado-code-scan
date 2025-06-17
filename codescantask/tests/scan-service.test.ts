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

import { ScanService } from '../services/scan.service';
import assert from 'assert';
import path from "path";
import fs from "fs";
import { OUTPUT_FILEPATH, RUNTIME_CONTAINER } from "../app.input";

describe('ScanService', function () {


    it('should correctly return the dependency scope command', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScope: 'prod',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            scanFiles: true,
            skipSnippets: false,
            settingsFilePath: '',
            scanossSettings: false,
            debug: false
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = (service as any).dependencyScopeArgs();
        console.log(command);
        assert.deepStrictEqual(command, [ '--dep-scope', 'prod' ]);
    });

    it('Should return --dependencies-only parameter', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScope: '',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            dependenciesEnabled: true,
            scanFiles: false,
            skipSnippets: false,
            settingsFilePath: '',
            scanossSettings: false,
            debug: false
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = (service as any).buildDependenciesArgs();
        assert.deepStrictEqual(command, [ '--dependencies-only' ]);
    });

    it('Should return dependencies parameter', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScope: '',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            dependenciesEnabled: true,
            scanFiles: true,
            skipSnippets: false,
            settingsFilePath: '',
            scanossSettings: false,
            debug: false
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = (service as any).buildDependenciesArgs();
        assert.deepStrictEqual(command, [ '--dependencies' ]);
    });

    it('Should return skip snippet parameter', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScope: '',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            dependenciesEnabled: true,
            scanFiles: true,
            skipSnippets: true,
            settingsFilePath: '',
            scanossSettings: false,
            debug: false
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = (service as any).buildSnippetArgs();
        assert.deepStrictEqual(command,["-S"]);
    });

    it('Should return a command with skip snippet and prod dependencies', async function () {
        const service = new ScanService({
            outputFilepath: 'results.json',
            inputFilepath: 'inputFilepath',
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScope: 'prod',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            dependenciesEnabled: true,
            scanFiles: true,
            skipSnippets: true,
            settingsFilePath: '',
            scanossSettings: false,
            debug: false
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = await (service as any).buildArgs();
        console.log(command);
        assert.notDeepStrictEqual(command,'')
    });


    it('Should scan dependencies', async function () {
        this.timeout(30000);
        (OUTPUT_FILEPATH as any) = 'test-results.json';
        const TEST_DIR = __dirname;
        const resultPath = path.join(TEST_DIR, 'data', 'test-results.json');
        const service = new ScanService({
            outputFilepath: resultPath,
            inputFilepath: path.join(TEST_DIR, 'data'),
            runtimeContainer: RUNTIME_CONTAINER,
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            dependenciesEnabled: true,
            sbomEnabled:false,
            scanFiles: true,
            skipSnippets: false,
            settingsFilePath: 'scanoss.json',
            scanossSettings: false,
            debug: false
        });

        // Accessing the private method by bypassing TypeScript type checks
        const results = await service.scan();
        assert.equal(results['package.json'][0].dependencies.length>0, true);
        await fs.promises.rm(resultPath)
    });

it('should add --debug flag to command arguments when debug option is enabled', async function() {
    const scanService = new ScanService({
        outputFilepath: 'results.json',
        inputFilepath: 'inputFilepath',
        runtimeContainer: RUNTIME_CONTAINER,
        dependencyScopeInclude: '',
        dependencyScopeExclude: '',
        dependenciesEnabled: true,
        sbomEnabled: false,
        scanFiles: true,
        skipSnippets: false,
        settingsFilePath: 'scanoss.json',
        scanossSettings: false,
        debug: true
    });

    const args = await (scanService as any).buildArgs();

    assert.deepStrictEqual(args,[
        "run",
        "-v",
        "inputFilepath:/scanoss",
        RUNTIME_CONTAINER,
        "scan",
        ".",
        "--output",
        "./results.json",
        "--dependencies",
        "--debug"
    ]);
  })
});