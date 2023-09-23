import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from "child_process";
import { ResultPreviewFile, RetrievePreviewJson } from './files';

export class SfConflictProvider implements vscode.TreeDataProvider<ConflictItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<ConflictItem | undefined | null | void> = new vscode.EventEmitter<ConflictItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ConflictItem | undefined | null | void> = this._onDidChangeTreeData.event;

  retrieveState: RetrievePreviewJson | undefined;

  conflicts: ConflictFile[] | undefined;
  retrieve: ConflictFile[] | undefined;
  deploy: ConflictFile[] | undefined;

  retFileTypes: ConflictItem[] | undefined;

  loadPromise: Promise<boolean>;

  constructor(private workspaceRoot: string) {
    this.loadPromise = this.reloadStatus();
  }

  reloadStatus() {
    return new Promise<boolean>((res, rej) => {
      cp.exec('sf project retrieve preview --json', { cwd: this.workspaceRoot }, (err, stdout, stderr) => {
        if (stdout) {
          this.retrieveState = JSON.parse(stdout);
          this.retrieve = this.retrieveState?.result.toRetrieve.map(a => new ConflictFile(a.fullName, a.type));

          if (this.retrieve) {
            const fileGroup: {} | undefined = this.retrieveState?.result.toRetrieve.reduce(
              (result, item) => ({
                ...result,
                [item["type"]]: [
                  // @ts-ignore
                  ...(result[item["type"]] || []),
                  item,
                ],
              }),
              {},
            );
            if (fileGroup) {
              this.retFileTypes = Object.entries(fileGroup).map((a) => new ConflictGroup(a[0], (<ResultPreviewFile[]>a[1]).length, vscode.TreeItemCollapsibleState.Collapsed));
            }
          }
          return res(true);

        }
        if (stderr) {
          console.log('stderr: ' + stderr);
        }
        if (err) {
          console.log('error: ', err);
          vscode.window.showInformationMessage('Workspace has no package.json');
          this.retrieve = undefined;
        }
        return rej(false);
      });
      
    });
  }

  getTreeItem(element: ConflictItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ConflictItem): Promise<ConflictItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }
    if (element) {
      return Promise.resolve(
        this.retrieve?.filter(a => a.tooltip === element.name) ?? []
      );
    } else {
      await this.loadPromise;
      return Promise.resolve(this.retFileTypes ?? []);
    }
  }

  refresh(): void {
    this.loadPromise = this.reloadStatus();
    this._onDidChangeTreeData.fire();
  }

}

class ConflictItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.tooltip = tooltip;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}

class ConflictGroup extends ConflictItem {
  constructor(
    public readonly name: string,
    private number: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(name, number.toString(), collapsibleState);
    this.description = `(${this.number} files)`;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}

class ConflictFile extends ConflictItem {
  constructor(
    public readonly fileName: string,
    private filePath: string
  ) {
    super(fileName, filePath, vscode.TreeItemCollapsibleState.None);
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}