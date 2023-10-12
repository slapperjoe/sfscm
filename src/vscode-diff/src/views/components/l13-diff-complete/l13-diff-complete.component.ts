//	Imports ____________________________________________________________________

import { L13Component, L13Element, L13Query } from '../../@l13/core';

import { disableContextMenu, setLabel } from '../../common';

import styles from '../styles';
import templates from '../templates';

import { L13DiffCompleteViewModelService } from './l13-diff-complete.service';
import type { L13DiffCompleteViewModel } from './l13-diff-complete.viewmodel';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

@L13Component({
	name: 'l13-diff-complete',
	service: L13DiffCompleteViewModelService,
	styles: [styles['l13-diff-complete/l13-diff-complete.css']],
	template: templates['l13-diff-complete/l13-diff-complete.html'],
})
export class L13DiffCompleteComponent extends L13Element<L13DiffCompleteViewModel> {
	
	@L13Query('button')
	private button: HTMLButtonElement;
	
	public constructor () {
		
		super();
		
		setLabel(this.button, 'Complete');
		
		this.button.addEventListener('click', ({ altKey }) => this.dispatchCustomEvent('complete', { altKey }));
		
		disableContextMenu(this);
		
	}
	
}

//	Functions __________________________________________________________________
