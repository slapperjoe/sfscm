//	Imports ____________________________________________________________________

import type { CompleteEventsInit } from '../../../../types';

// import { msg } from '../../../common';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function init ({ complete }: CompleteEventsInit) {
	
	complete.addEventListener('complete', () => {
		
	// 	if ((<any>(<MouseEvent>event).detail).altKey) msg.send('complete:multi');
	// 	else diff.initCompare();
		
	});
	
}

//	Functions __________________________________________________________________
