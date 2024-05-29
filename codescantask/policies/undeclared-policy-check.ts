import { generateTable } from '../utils/markdown.utils';
import { Component, getComponents } from '../services/result.service';
import { PolicyCheck } from './policy-check';
import { parseSBOM } from '../utils/sbom.utils';
import { REPO_DIR, SBOM_FILEPATH } from '../app.input';
import { ScannerResults } from '../services/result.interface';
import * as tl from 'azure-pipelines-task-lib';

/**
 * Verifies that all components identified in scanner results are declared in the project's SBOM.
 * The run method compares components found by the scanner against those declared in the SBOM.
 *
 * It identifies and reports undeclared components, generating a summary and detailed report of the findings.
 *
 */
export class UndeclaredPolicyCheck extends PolicyCheck {
    constructor() {
        super(`Undeclared Policy`);
    }

    async run(scannerResults: ScannerResults): Promise<void> {
        await this.start();

        const nonDeclaredComponents: Component[] = [];
        let declaredComponents: Partial<Component>[] = [];

        const comps = getComponents(scannerResults);

        // get declared components
        try {
            if(!SBOM_FILEPATH) throw new Error("SBOM File path not found");
            const sbom = await parseSBOM(SBOM_FILEPATH);
            declaredComponents = sbom.components || [];
        } catch (e: unknown) {
            if (e instanceof Error) {
                tl.error(e.message);
                tl.warning(`Warning on policy check: ${this.checkName}. SBOM file could not be parsed (${SBOM_FILEPATH})`);
            }
        }

        comps.forEach(c => {
            if (!declaredComponents.some(component => component.purl === c.purl)) {
                nonDeclaredComponents.push(c);
            }
        });

        const summary = this.getSummary(nonDeclaredComponents);
        const details = this.getDetails(nonDeclaredComponents);

        if (nonDeclaredComponents.length === 0) {
            await this.success(summary, details);
        } else {
            await this.reject(summary, details);
        }
    }

    private getSummary(components: Component[]): string {
        return components.length === 0
            ? '### :white_check_mark: Policy Pass \n #### Not undeclared components were found'
            : `### :x: Policy Fail \n #### ${components.length} undeclared component(s) were found. \n See details for more information.`;
    }

    private getDetails(components: Component[]): string | undefined {
        if (components.length === 0) return undefined;

        const headers = ['Component', 'Version', 'License'];
        const rows: string[][] = [];

        components.forEach(component => {
            const licenses = component.licenses.map(l => l.spdxid).join(' - ');
            rows.push([component.purl, component.version, licenses]);
        });

        const snippet = JSON.stringify(
            components.map(({ purl }) => ({ purl })),
            null,
            4
        );

        let content = `### Undeclared components \n ${generateTable(headers, rows)}`;
        content += `#### Add the following snippet into your \`sbom.json\` file \n \`\`\`json \n ${snippet} \n \`\`\``;

        return content;
    }
}