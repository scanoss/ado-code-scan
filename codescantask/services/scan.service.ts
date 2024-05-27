import * as tl from 'azure-pipelines-task-lib/task';
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
            outputFilepath:'',
            inputFilepath: tl.getVariable('Build.Repository.LocalPath') || '' // Get repository path
        };

        console.log("OPTIONS", this.options);
    }
    async scan() {
        try {
            try {
                const repositoryPath = tl.getVariable('Build.Repository.LocalPath') || '';
                const dockerCommand = `docker run -v "${repositoryPath}":"/scanoss" ghcr.io/scanoss/scanoss-py:v1.9.0 scan .`;

                console.log(`Executing Docker command: ${dockerCommand}`);

                const options = {
                    failOnStdErr: false,
                    ignoreReturnCode: true
                };

                const resultCode = await tl.execAsync('bash', ['-c', dockerCommand], options);

                if (resultCode !== 0) {
                    console.error(`Error: Docker command failed with exit code ${resultCode}`);
                    tl.setResult(tl.TaskResult.Failed, 'Docker command failed');
                } else {
                    console.log('Docker command executed successfully');
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

    private async buildCommand(): Promise<string> {
        return `docker run -v "${this.options.inputFilepath}":"/scanoss" ghcr.io/scanoss/scanoss-py:v1.9.0 scan .`;
    }
}