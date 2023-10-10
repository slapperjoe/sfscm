/* eslint-disable */
export default {
	"l13-diff-actions/l13-diff-actions.html": "<button id=\"l13_copy_right\" [disabled]=\"copyDisabled\"></button>\r\n<button id=\"l13_select_deleted\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_select_modified\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_select_untracked\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_select_all\" [disabled]=\"selectDisabled\"></button>\r\n<button id=\"l13_copy_left\" [disabled]=\"copyDisabled\"></button>",
	"l13-diff-compare/l13-diff-compare.html": "<button [disabled]=\"disabled\">Compare</button>\r\n<button [disabled]=\"disabled\">Accept Merge</button>\r\n<button [disabled]=\"disabled\">Cancel Merge</button>",
	"l13-diff-context/l13-diff-context.html": "<button id=\"copy\" [disabled]=\"copyDisabled\"></button><button id=\"goto\" [disabled]=\"gotoDisabled\"></button><button id=\"reveal\" [disabled]=\"revealDisabled\"></button><button id=\"delete\" [disabled]=\"deleteDisabled\"></button>",
	"l13-diff-input/l13-diff-input.html": "<input type=\"text\" [(model)]=\"value\" [disabled]=\"disabled\">\r\n<button [disabled]=\"disabled\"></button>\r\n<slot></slot>",
	"l13-diff-intro/l13-diff-intro.html": "<l13-diff-shortcuts></l13-diff-shortcuts>",
	"l13-diff-list/l13-diff-list.html": "<l13-diff-list-content></l13-diff-list-content>",
	"l13-diff-menu/l13-diff-menu.html": "<l13-diff-menu-lists></l13-diff-menu-lists>",
	"l13-diff-navigator/l13-diff-navigator.html": "<canvas id=\"ruler\"></canvas><canvas id=\"map\"></canvas><div></div>",
	"l13-diff-panel/l13-diff-panel.html": "<l13-diff-loading [if]=\"loading\"></l13-diff-loading>\r\n<slot></slot>",
	"l13-diff-search/l13-diff-search.html": "<div id=\"l13_resizer\"></div>\r\n<div class=\"l13-input\">\r\n\t<input id=\"l13_searchterm\" type=\"text\" [(model)]=\"searchterm\" [disabled]=\"disabled\">\r\n\t<input id=\"l13_case_sensitive\" type=\"checkbox\" [(model)]=\"useCaseSensitive\" [disabled]=\"disabled\">\r\n\t<input id=\"l13_use_regexp\" type=\"checkbox\" [(model)]=\"useRegExp\" [disabled]=\"disabled\">\r\n\t<div class=\"l13-message\" [if]=\"error\">{{ error }}</div>\r\n</div>\r\n<input id=\"l13_use_files\" class=\"-option\" type=\"checkbox\" [(model)]=\"useFiles\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_folders\" class=\"-option\" type=\"checkbox\" [(model)]=\"useFolders\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_symlinks\" class=\"-option\" type=\"checkbox\" [(model)]=\"useSymlinks\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_conflicts\" class=\"-option\" type=\"checkbox\" [(model)]=\"useConflicts\" [disabled]=\"disabled\">\r\n<input id=\"l13_use_others\" class=\"-option\" type=\"checkbox\" [(model)]=\"useOthers\" [disabled]=\"disabled\">\r\n<button id=\"l13_close\" [disabled]=\"disabled\"></button>",
	"l13-diff-swap/l13-diff-swap.html": "<button [disabled]=\"disabled\"></button>",
	"l13-diff-views/l13-diff-views.html": "<input id=\"l13_show_unchanged\" type=\"checkbox\" [(model)]=\"unchangedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_deleted\" type=\"checkbox\" [(model)]=\"deletedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_modified\" type=\"checkbox\" [(model)]=\"modifiedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_untracked\" type=\"checkbox\" [(model)]=\"untrackedChecked\" [disabled]=\"disabled\">\r\n<input id=\"l13_show_ignored\" type=\"checkbox\" [(model)]=\"ignoredChecked\" [disabled]=\"disabled\">",
	"l13-diff/l13-diff.html": "<l13-diff-panel vmId=\"panel\">\r\n\t<l13-diff-folders>\r\n\t\t<l13-diff-input vmId=\"left\" id=\"left\" placeholder=\"Left file or folder\"></l13-diff-input>\r\n\t\t<l13-diff-swap vmId=\"swap\"></l13-diff-swap>\r\n\t\t<l13-diff-input vmId=\"right\" id=\"right\" placeholder=\"Right file or folder\"></l13-diff-input>\r\n\t</l13-diff-folders>\r\n\t<l13-diff-tools>\r\n\t\t<!-- <l13-diff-views vmId=\"views\"></l13-diff-views> -->\r\n\t\t<l13-diff-actions vmId=\"actions\"></l13-diff-actions>\r\n\t\t<l13-diff-compare vmId=\"compare\"></l13-diff-compare>\r\n\t</l13-diff-tools>\r\n\t<l13-diff-widgets></l13-diff-widgets>\r\n</l13-diff-panel>\r\n<l13-diff-list vmId=\"list\"></l13-diff-list>\r\n<l13-diff-navigator vmId=\"navigator\"></l13-diff-navigator>\r\n<l13-diff-intro></l13-diff-intro>\r\n<l13-diff-no-result>No items are matching the current filter settings.</l13-diff-no-result>"
};