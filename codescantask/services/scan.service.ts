import * as tl from 'azure-pipelines-task-lib/task';
import path from 'path';
import * as fs from 'fs';
import {
    API_KEY,
    API_URL,
    DEPENDENCIES_ENABLED,
    OUTPUT_FILEPATH,
    REPO_DIR,
    SBOM_ENABLED,
    SBOM_FILEPATH, SBOM_TYPE
} from '../app.input';
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
            outputFilepath: OUTPUT_FILEPATH,
            inputFilepath: REPO_DIR
        };
    }
    async scan() {
        try {
            try {
                const dockerCommand = this.buildCommand();
                console.log(`Executing Docker command: ${dockerCommand}`);

                const options = {
                    failOnStdErr: false,
                    ignoreReturnCode: true,
                };
                const resultCode = await tl.execAsync('bash', ['-c', dockerCommand], options);

                if (resultCode !== 0) {
                    console.error(`Error: Docker command failed with exit code ${resultCode}`);
                    tl.setResult(tl.TaskResult.Failed, 'Docker command failed');
                } else {
                    console.log('Docker command executed successfully');
                    this.uploadResultsToArtifacts();
                }
            } catch (error: any) {
                console.error('Error:', error);
                tl.setResult(tl.TaskResult.Failed, error.message);
            }

        } catch (error: any) {
            tl.setResult(tl.TaskResult.Failed, error.message);
            throw error;
        }
    }

    private buildCommand(): string {
       return `docker run -v "${this.options.inputFilepath}":"/scanoss" ghcr.io/scanoss/scanoss-py:v1.9.0 scan . --output ./results.json ${this.options.dependenciesEnabled ? `--dependencies` : ''} ${this.options.apiUrl ? `--apiurl ${this.options.apiUrl}` : ''} ${this.options.apiKey ? `--key ${this.options.apiKey}` : ''}`.replace(/\n/gm, ' ');
    }

    private uploadResultsToArtifacts(){
        const artifactName = 'scanoss';
        tl.command('artifact.upload', { artifactname: artifactName }, this.options.outputFilepath);
    }
}