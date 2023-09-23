
import * as vscode from 'vscode';
import * as cp from "child_process";
import { SfConflictProvider } from './sfConflictProvider';
import { RetrieveJson } from './files';

export function activate(context: vscode.ExtensionContext) {

	const rootPath =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: "";


	let disposable = vscode.commands.registerCommand('sfscm.retrieve', () => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Retrieving latest from SF sandpit",
			cancellable: false
		}, (progress, token) => {
			let dataGot = false;
			token.onCancellationRequested(() => {
				console.log("User canceled the long running operation");
			});

			progress.report({ increment: 0 });
			setTimeout(() => {
				if (!dataGot) {
					progress.report({ increment: 10, message: " - still going..." });
				}
			}, 30000);

			const p = new Promise<void>(resolve => {

				cp.exec('sf project retrieve start --json --metadata Profile', { cwd: rootPath }, (err, stdout, stderr) => {
					dataGot = true;
					progress.report({ increment: 80 });
					if (stdout) {
						let response: RetrieveJson = JSON.parse(stdout);
						if (response.result.success) {
							vscode.window.showInformationMessage(`${response.result.files.length} files retrieved.`);
						}
					}
					progress.report({ increment: 100 });
					if (stderr) {
						console.log('stderr: ' + stderr);
					}
					if (err) {
						console.log('error: ', err);
						vscode.window.showInformationMessage('Workspace has no package.json');
					}
					resolve();
				});
			});
			return p;
		});

	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('sfscm.deploy', () => {
		vscode.window.showInformationMessage('Getting latest Deploy Preview!!');
		console.log("!!!");
	});

	context.subscriptions.push(disposable);

	const sfConflictProvider = new SfConflictProvider(rootPath);
	vscode.window.registerTreeDataProvider('sfConflicts', sfConflictProvider);
	vscode.commands.registerCommand('sfConflicts.refreshEntry', () =>
		sfConflictProvider.refresh()
	);

}

// This method is called when your extension is deactivated
export function deactivate() { }
