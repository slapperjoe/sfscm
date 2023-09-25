
import * as vscode from 'vscode';
import * as cp from "child_process";
import { ConflictGroup, SfConflictProvider } from './sfConflictProvider';
import { ConfigObject, RetrieveJson } from './files';

const rootPath =
	vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
		? vscode.workspace.workspaceFolders[0].uri.fsPath
		: "";

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('sfscm.retrieve', () => {
		retrieveFiles();
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('sfscm.deploy', () => {
		vscode.window.showInformationMessage('Getting latest Deploy Preview!!');
		console.log("!!!");
	});

	context.subscriptions.push(disposable);

	vscode.commands.registerCommand('sfConflicts.retrieveType', (node: ConflictGroup) => retrieveFiles(node.name));

	const sfConflictProvider = new SfConflictProvider(rootPath);
	vscode.window.registerTreeDataProvider('sfConflicts', sfConflictProvider);
	vscode.commands.registerCommand('sfConflicts.refreshEntry', () =>
		sfConflictProvider.refresh()
	);

}

function retrieveFiles(metadataType?: string | undefined) {
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: `Retrieving latest ${metadataType}`,
		cancellable: false
	}, (progress, token) => {
		let dataGot = false;
		token.onCancellationRequested(() => {
			console.log("User canceled the long running operation");
		});

		//progress.report({ increment: 0 });
		setTimeout(() => {
			if (!dataGot) {
				progress.report({ message: " - still going..." });
			}
		}, 30000);

		const p = new Promise<void>(resolve => {
			let executeString = "sf project retrieve start --json";
			if (metadataType) {
				executeString += ` --metadata ${metadataType}`;
			}


			cp.exec(executeString, 
				{ cwd: rootPath, 
					maxBuffer: 1024 * getConfig().readResponseBufferSizeKB 
				}, (err, stdout, stderr) => {
				dataGot = true;
				progress.report({ increment: 90 });
				if (err) {
					console.log('error: ', err);
					vscode.window.showErrorMessage(`${err.code} ${err.message} ${err.stack}`);
				}
				if (stdout) {
					try {
						let response: RetrieveJson = JSON.parse(stdout);
						if (response.result.success) {
							vscode.window.showInformationMessage(`${response.result.files.length} files retrieved.`);
						}
					} catch (e) {
						debugger;
					}
				}
				progress.report({ increment: 100 });
				if (stderr) {
					console.log('stderr: ' + stderr);
				}
				
				resolve();
			});
		});
		return p;
	});
}

function getConfig(): ConfigObject {
	return vscode.workspace.getConfiguration('sfscm') as ConfigObject;
}



// This method is called when your extension is deactivated
export function deactivate() { }
