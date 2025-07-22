import * as tl from "azure-pipelines-task-lib";

export class AdoService {
    public async uploadArtifact(filePath: string, artifactName: string = 'scanoss') {
        tl.debug(`Uploading artifact ${artifactName} to ADO...`);
        tl.command('artifact.upload', { artifactname: artifactName }, filePath);
    }
}

export const adoService = new AdoService();