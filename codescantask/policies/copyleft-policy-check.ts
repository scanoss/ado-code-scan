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

import { Component, getComponents } from '../services/result.service';
import { generateTable } from '../utils/markdown.utils';
import { ScannerResults } from '../services/result.interface';
import { PolicyCheck } from './policy-check';

/**
 * This class checks if any of the components identified in the scanner results are subject to copyleft licenses.
 * It filters components based on their licenses and looks for those with copyleft obligations.
 * It then generates a summary and detailed report of the findings.
 */
export class CopyleftPolicyCheck extends PolicyCheck {
    constructor() {
        super(`Copyleft Policy`);
    }

    async run(scannerResults: ScannerResults): Promise<void> {
        await this.start();
        const components = getComponents(scannerResults);

        // Filter copyleft components
        const componentsWithCopyleft = components.filter(component =>
            component.licenses.some(license => !!license.copyleft)
        );

        const summary = this.getSummary(componentsWithCopyleft);
        const details = this.getDetails(componentsWithCopyleft);

        if (componentsWithCopyleft.length === 0) {
            await this.success(summary, details);
        } else {
            await this.reject(summary, details);
        }
    }

    private getSummary(components: Component[]): string {
        return components.length === 0
            ? '### :white_check_mark: Policy Pass \n #### Not copyleft components were found'
            : `### :x: Policy Fail \n #### ${components.length} component(s) with copyleft licenses were found. \n See details for more information.`;
    }

    private getDetails(components: Component[]): string | undefined {
        if (components.length === 0) return undefined;

        const headers = ['Component', 'Version', 'License', 'URL', 'Copyleft'];
        const rows: string[][] = [];

        components.forEach(component => {
            component.licenses.forEach(license => {
                const copyleftIcon = license.copyleft ? ':x:' : ' ';
                rows.push([component.purl, component.version, license.spdxid, `${license.url || ''}`, copyleftIcon]);
            });
        });

        return generateTable(headers, rows);
    }
}