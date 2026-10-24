# BLOCK LIST · v3.8.9.5
| BLOCKid | name | inputdescribe | outputdescribe | BelongFILE |
|---|---|---|---|---|
| B-SEAPP-01 | reportSeappArea | sql, failure event | DB row / exception | cloud-worker/seapp-log-api.js |
| B-SEAPP-02 | seappLogApi | request, SQL | authorized JSON response | cloud-worker/seapp-log-api.js |
| B-SEAPP-03 | log UI | filter, auth session | rendered log entries | log/log.js |

This is the incremental instrumentation foundation, not a claim that all existing legacy code has been converted into BLOCKs.
