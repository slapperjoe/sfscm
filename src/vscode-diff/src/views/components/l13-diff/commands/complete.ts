//	Imports ____________________________________________________________________

import type { CompleteCommandsInit } from '../../../../types';

import { msg } from '../../../common';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function init({left, right, search }: CompleteCommandsInit) {

	msg.on('l13Diff.action.panel.complete', () => {

		if (!left.focused && !right.focused && !search.focused) {
			return;
		}

	});

	msg.on('l13Diff.action.panel.rejectComplete', () => null);

}

//	Functions __________________________________________________________________
