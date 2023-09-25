import { WorkspaceConfiguration } from "vscode"

export interface RetrievePreviewJson {
  status: number,
  warnings: [],
  result: RetrievePreviewResult
}

export interface RetrieveJson {
  status: number,
  warnings: [],
  result: RetrieveResult
}

export interface RetrievePreviewResult {
  conflicts: ResultPreviewFile[],
  ignored: [],
  toDelete: [],
  toDeploy: [],
  toRetrieve: ResultPreviewFile[]
}

export interface ResultPreviewFile {
  conflict: boolean,
  fullName: string,
  ignored: boolean,
  operation: string,
  path: string,
  projectRelativePath: string,
  type: string
}

export interface RetrieveResult {
  done: boolean,
  fileProperties: FileProperty[],
  files: RetrieveFile[],
  id: string,
  messages: [],
  status: string,
  success: boolean
}

export interface RetrieveFile {
  filePath: string,
  fullName: string,
  state: string,
  type: string
}

export interface FileProperty {
  createdById: string,
  createdByName: string,
  createdDate: string,
  fileName: string,
  fullName: string,
  id: string,
  lastModifiedBy: string,
  lastModifiedByName: string,
  lastModifiedDate: string,
  manageableState: string,
  type: string
}

export interface ConfigObject extends WorkspaceConfiguration {
  monitorLightningOnly: boolean,
  readResponseBufferSizeKB: number,
  retrievePreviewTimeout: number
}