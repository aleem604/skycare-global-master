#!/bin/bash

# Login to CloudFoundry 
#cf login -u chris.williams@puremoneysystems.com -o chris.williams@puremoneysystems.com

# Get the GUID for the CloudFoundry App
APP_GUID=$(cf app skycare-dev --guid)
# APP_GUID = a0759b63-4331-4788-8dd9-fcbde9799c2b

# Retreive the current settings for this CloudFoundry App
#cf curl /v2/apps/$APP_GUID
# Notice that the "ports" section includes 8080 as the only port

# Update the "ports" sections to include a second port
#cf curl /v2/apps/$APP_GUID -X PUT -d '{"ports": [8080, 8081]}'

# Get the GUID for the skycare-dev route (default route)
SKYCARE_ROUTE_GUID=$(cf curl /v2/routes?q=host:skycare-dev | grep \"guid\" | sed 's/\s*["]guid["]:\s["]//' | sed 's/["],//')
# SKYCARE_ROUTE_GUID=f5188284-a63d-47fa-bc6d-7c92c8371bd8

# Get the GUID for the skycare-dev-ws route (websockets route)
SKYCARE_WS_ROUTE_GUID=$(cf curl /v2/routes?q=host:skycare-dev-ws | grep \"guid\" | sed 's/\s*["]guid["]:\s["]//' | sed 's/["],//')
# SKYCARE-WS_ROUTE_GUID=3626d2ae-043b-4d67-89e2-0fb7b408bfe2

# Change the default route for the app to use port 8080
DEFAULT_ROUTE_CHANGE='{"app_guid": "'"$APP_GUID"'", "route_guid": "'"$SKYCARE_ROUTE_GUID"'", "app_port": 8080}'
cf curl /v2/route_mappings -v -X POST -d $DEFAULT_ROUTE_CHANGE.

# Change the websockets route for the app to use port 8081
WEBSOCKET_ROUTE_CHANGE='{"app_guid": "'"$APP_GUID"'", "route_guid": "'"$SKYCARE_WS_ROUTE_GUID"'", "app_port": 8081}'
cf curl /v2/route_mappings -v -X POST -d $WEBSOCKET_ROUTE_CHANGE.


