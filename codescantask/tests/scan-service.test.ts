import { ScanService } from '../services/scan.service';
import assert from 'assert';
import path from "path";
import * as os from "node:os";
import fs from "fs";
import sinon from 'sinon';
import * as tl from 'azure-pipelines-task-lib/task';



describe('ScanService', function () {


    it('should correctly return the dependency scope command', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: '',
            dependencyScope: 'prod',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            scanFiles: true,
            skipSnippets: false,
            settingsFilePath: '',
            scanossSettings: false,
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = (service as any).dependencyScopeCommand();
        assert.equal(command,'--dep-scope prod')
    });

    it('Should return --dependencies-only parameter', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: '',
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
        const command = (service as any).buildDependenciesCommand();
        assert.equal(command.replace(' ', ''),'--dependencies-only')
    });

    it('Should return dependencies parameter', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: '',
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
        const command = (service as any).buildDependenciesCommand();
        assert.equal(command.replace(' ', ''),'--dependencies')
    });

    it('Should return skip snippet parameter', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: '',
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
        const command = (service as any).buildSnippetCommand();
        assert.equal(command,'-S')
    });

    it('Should return a command with skip snippet and prod dependencies', async function () {
        const service = new ScanService({
            outputFilepath: 'results.json',
            inputFilepath: 'inputFilepath',
            runtimeContainer: 'ghcr.io/scanoss/scanoss-py:v1.17.5',
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
        const command = await (service as any).buildCommand();
        assert.equal(command.replace(/\s/g,''),'docker run -v "inputFilepath":"/scanoss" ghcr.io/scanoss/scanoss-py:v1.17.5 scan . --output ./results.json --dependencies --dep-scope prod  -S '.replace(/\s/g,''))
    });

    it('Should return settings parameter', async function () {
        const service = new ScanService({
            outputFilepath: 'results.json',
            inputFilepath: 'inputFilepath',
            runtimeContainer: 'ghcr.io/scanoss/scanoss-py:v1.17.5',
            dependencyScope: 'prod',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            dependenciesEnabled: true,
            sbomEnabled:true,
            scanFiles: true,
            skipSnippets: true,
            settingsFilePath: 'scanoss.json',
            scanossSettings: true,
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = await (service as any).buildCommand();
        assert.equal(command.replace(/\s/g,''),'docker run -v "inputFilepath":"/scanoss" ghcr.io/scanoss/scanoss-py:v1.17.5 scan . --output ./results.json --dependencies --dep-scope prod --settings scanoss.json -S'.replace(/\s/g,''))
    });

});