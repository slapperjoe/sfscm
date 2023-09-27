import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from "child_process";
import * as _ from "lodash";
import { ConfigObject, ResultPreviewFile, RetrievePreviewJson } from './files';

export class SfConflictProvider implements vscode.TreeDataProvider<ConflictItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<ConflictItem | undefined | null | void> = 
                  new vscode.EventEmitter<ConflictItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ConflictItem | undefined | null | void> = 
                  this._onDidChangeTreeData.event;

  retrieveState: RetrievePreviewJson | undefined;

  conflicts: ConflictFile[] | undefined;
  retrieve: ConflictFile[] | undefined;
  deploy: ConflictFile[] | undefined;

  retFileTypes: ConflictItem[] | undefined;

  loadPromise: Promise<boolean>;
  loading: boolean;

  constructor(private workspaceRoot: string) {
    this.loading = false;
    this.loadPromise = Promise.resolve(false);
    this.createTimedRefresh();
  }

  async createTimedRefresh() {
    this.refresh();
    this.loadPromise.then(a => {
      ;
      setTimeout(() => {
        this.createTimedRefresh();
      }, this.getConfig().retrievePreviewTimeout * 1000);
    });
  }

  reloadStatus() {
    if (!this.loading) {
      return new Promise<boolean>((res, rej) => {
        this.loading = true;
        let commandString = 'sf project retrieve preview --json';

        cp.exec(commandString,
          {
            cwd: this.workspaceRoot,
            maxBuffer: 1024 * this.getConfig().readResponseBufferSizeKB
          }, (err, stdout, stderr) => {
            if (stdout) {
              if (err) {
                console.log('error: ', err);
                vscode.window.showErrorMessage(`${err.code} ${err.message} ${err.stack}`);
              }
              this.retrieveState = JSON.parse(stdout);
              this.retrieve = this.retrieveState?.result.toRetrieve.map(a => new ConflictFile(a.fullName, a.type, a.path));
              const oldConflicts = this.conflicts;
              this.conflicts = this.retrieveState?.result.conflicts.map(a => new ConflictFile(a.fullName, a.type, a.path, true));

              this.retFileTypes = [];

              if (this.retrieve) {
                const fileGroup: {} | undefined = this.reduceResults(this.retrieveState?.result.toRetrieve);
                if (fileGroup) {
                  let fileSet = this.createConflictGroup(fileGroup);
                  this.retFileTypes = fileSet;
                }
              }

              if (this.conflicts && this.conflicts.length > 0){
                if (!_.isEqual(this.conflicts, oldConflicts)){
                  vscode.window.showWarningMessage(`Conflicted files spotted`);
                }
                const fileGroup: {} | undefined = this.reduceResults(this.retrieveState?.result.conflicts);
                if (fileGroup) {
                  let fileSet = this.createConflictGroup(fileGroup, true);
                  this.retFileTypes = _.unionBy(fileSet, this.retFileTypes, 'name');
                }
              }
              this.loading = false;
              return res(true);

            }
            if (stderr) {
              console.log('stderr: ' + stderr);
            }
            this.loading = false;
            return rej(false);
          });

      });
    } else {
      this.loading = false;
      console.log("Already refreshing.");
      return Promise.reject('Already refreshing');
    }
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
      const conflicts = this.conflicts?.filter(a => a.tooltip === element.name) ?? [];
      const retrievals = this.retrieve?.filter(a => a.tooltip === element.name) ?? [];
      return Promise.resolve(_.union(conflicts, retrievals));
    } else {
      await this.loadPromise;
      return Promise.resolve(this.retFileTypes ?? []);
    }
  }

  reduceResults(resultSet: ResultPreviewFile[] | undefined) {
    if (resultSet) {
      return resultSet.reduce(
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
    }
    return undefined;
  }

  createConflictGroup(fileGroup: {} | undefined, hasConflict: boolean = false) {
    if (fileGroup) {
      let conflictGroup = Object.entries(fileGroup).map((a) => new ConflictGroup(a[0], 
                  (<ResultPreviewFile[]>a[1]).length, vscode.TreeItemCollapsibleState.Collapsed, hasConflict));
      if (this.getConfig().monitorLightningOnly) {
        conflictGroup = conflictGroup.filter(a => a.name === "LightningComponentBundle");
      }
      return conflictGroup;
    }
    return [];

  }

  refresh(): void {
    this.loadPromise = this.reloadStatus();
    this._onDidChangeTreeData.fire();
  }

  getConfig(): ConfigObject {
    return vscode.workspace.getConfiguration('sfscm') as ConfigObject;
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

export class ConflictGroup extends ConflictItem {
  constructor(
    public readonly name: string,
    private number: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public hasConflicts: boolean = false
  ) {
    super(name, number.toString(), collapsibleState);
    this.description = this.hasConflicts ? `(${this.number} conflicts)` : `(${this.number} items)`;
    this.contextValue = "group";

    if (hasConflicts){
      this.iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'icons', 'light', 'check.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'icons', 'dark', 'check.svg')
      };
    }
  }

  iconPath = {
    light: '',
    dark: ''
  };
}

export class ConflictFile extends ConflictItem {
  constructor(
    //public type: string,
    public readonly fileName: string,
    public type: string,
    public filePath: string,
    public isConflicted : boolean = false
  ) {
    super(fileName, type, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "file";

    if (isConflicted){
      this.contextValue = "conflictfile";
      this.iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'icons', 'light', 'check.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'icons', 'dark', 'check.svg')
      };
    }
  }

  iconPath = {
    light: '',
    dark: ''
  };
}