# SFMerge README

### Salesforce Source Control Management.

Are you a budding Lightning Web Component developer?  Come across from another platform and keen to flex your muscles in
a Saleforce Sandbox or Instance?

Have another developer or two on the same instance and find you are constantly stumbling over each other and finding the 
source control inconsistent at best?

Well you can do what your highly paid consultants suggest and limit one developer to one component (WTF?!?!)

Or try this so you actually have some sort of merging experience..

This extension **HEAVILY** relies on [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).

![Pic of SFMerge in action](/media/screenshot.png)

## Features

* Show which files have changed in the Sandbox/Instance
* Warn when something has changed both locally and remotely
* Allow a local merge of the two conflicts so it can be pushed up easily
 
## Requirements

Ensure SF cli v2 is installed.  I highly, highly recommend installing globally via NPM.  'SF update' seems questionable at best for updating.  

```
npm i -g @salesforce/cli
```
## Extension Settings

Search SFSCM for extension settings.
* "sfscm.readResponseBufferSizeKB": Maximum size of read buffer when retrieving JSON information from source (default 5120kB.)
* "sfscm.monitorLightningOnly": Only monitor LightningComponentBundles.
* "sfscm.retrievePreviewTimeout": Time (in seconds) between each 'retrieve preview' backend call.

## Known Issues

- ?!?!

## Release Notes

### 0.0.6 

* Initial push to store for test

### 0.0.5 

Merging via Diff Folders
* Fix Diff services not loading correctly to detect text files

### 0.0.4 

Merging via Diff Folders
* Lightning differences can now be 'merged' via Diff Folders extension
* Defect fixes

### 0.0.2 

Initial monitoring of conflicts
* Highlight in File Management window
* Pop up warning on first notice of a item conflict

### 0.0.1

Initial test release of SFSCM
* Show what is in sandbox and not local
* Allow pulling down of files.
