//	Imports ____________________________________________________________________

import { ViewModelService } from '../../@l13/component/view-model-service.abstract';

import type { ViewModelConstructor } from '../../@types/components';

import { L13DiffCompleteViewModel } from './l13-diff-complete.viewmodel';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class L13DiffCompleteViewModelService extends ViewModelService<L13DiffCompleteViewModel> {
	
	public name = 'l13-diff-complete';
	
	public vmc: ViewModelConstructor<L13DiffCompleteViewModel> = L13DiffCompleteViewModel;
	
}

//	Functions __________________________________________________________________
