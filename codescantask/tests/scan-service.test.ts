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
        });

        // Accessing the private method by bypassing TypeScript type checks
        const results = await service.scan();
        assert.equal(results['package.json'][0].dependencies.length>0, true);
        await fs.promises.rm(resultPath)
    });

});