/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Simon Waelti
* Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import * as nodes from '../parser/macroNodes';
import { LintVisitor } from './lint';
import { 
	TextDocument, 
	Range, 
	Diagnostic, 
	LanguageSettings, 
	MacroFileProvider 
} from '../macroLanguageTypes';
import { 
	LintConfiguration 
} from './lintRules';

export class MacroValidation {

	constructor( private fileProvider: MacroFileProvider) {}

	public doValidation(document: TextDocument, macroFile: nodes.MacroFile, settings: LanguageSettings): Diagnostic[] {
		if (settings && settings?.validate?.enable === false) {
			return [];
		}

		const entries: nodes.IMarker[] = [];
		entries.push.apply(entries, nodes.ParseErrorCollector.entries(macroFile));
		entries.push.apply(entries, LintVisitor.entries(macroFile, document, this.fileProvider, new LintConfiguration(settings && settings.lint)));

		function toDiagnostic(marker: nodes.IMarker): Diagnostic {
			const range = Range.create(document.positionAt(marker.getOffset()), document.positionAt(marker.getOffset() + marker.getLength()));
			const source = document.languageId;

			return <Diagnostic>{
				code: marker.getRule().id,
				source: source,
				message: marker.getMessage(),
				severity: marker.getLevel(),
				range: range
			};
		}

		return entries.filter(entry => entry.getLevel() !== nodes.Level.Ignore).map(toDiagnostic);
	}
}
