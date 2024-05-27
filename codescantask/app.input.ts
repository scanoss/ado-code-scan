import tl = require('azure-pipelines-task-lib/task');
import path from 'path';

export const DEPENDENCIES_ENABLED = tl.getInput('dependenciesEnabled') === 'true';
export const API_KEY = tl.getInput('apiKey');
export const API_URL = tl.getInput('apiUrl');
export const OUTPUT_FILEPATH = path.join(tl.getVariable('Build.Repository.LocalPath') || '' , 'results.json');
export const REPO_DIR = tl.getVariable('Build.Repository.LocalPath') || ''; // Get repository path
export const SBOM_ENABLED = tl.getInput('sbomEnabled') === 'true';
export const SBOM_FILEPATH = tl.getInput('sbomFilepath');
export const SBOM_TYPE = tl.getInput('sbomType');