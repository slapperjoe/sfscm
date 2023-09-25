# sfscm README

SFSCM Salesforce Source Control Management

## Features

* Warn when an local only file has been changed in sandbox
* Monitoring changed files in sandbox
* Pulling down those files
 
## Requirements

Ensure SF is installed

## Extension Settings

Search SFSCM for extension settings.
* "sfscm.readResponseBufferSizeKB": Maximum size of read buffer when retrieving JSON information from source (default 5120kB.)
* "sfscm.monitorLightningOnly": Only monitor LightningComponentBundles.
* "sfscm.retrievePreviewTimeout": Time (in seconds) between each 'retrieve preview' backend call.

## Known Issues

-

## Release Notes

-

### 0.0.2 

Initial monitoring of conflicts
* Highlight in File Management window
* Pop up warning on first notice of a item conflict

### 0.0.1

Initial test release of SFSCM
* Show what is in sandbox and not local
* Allow pulling down of files.
