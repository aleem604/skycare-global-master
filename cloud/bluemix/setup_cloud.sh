#!/bin/bash

ibmcloud fn trigger create OnceWeeklyCheckExpiredCreds --feed /whisk.system/alarms/alarm --param cron "0 14 * * 1" --param trigger_payload "{\"docid\":\"escorts\",\"viewname\":\"expiringCredentials\"}" --param startDate "2019-01-27T23:50:00.000Z" --param stopDate "2025-12-31T23:59:00.000Z"
