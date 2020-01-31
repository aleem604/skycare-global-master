#!/bin/sh

# Create the database
curl -X PUT -H 'Authorization:Basic YWRtaW46cGFzcw==' -v http://localhost:8080/skycare

# Create the design documents, views, and indexes
curl -X PUT -H 'Authorization:Basic YWRtaW46cGFzcw==' -H 'Content-Type: application/json' http://localhost:8080/skycare/_design/cases -d @designDoc_cases.json
curl -X PUT -H 'Authorization:Basic YWRtaW46cGFzcw==' -H 'Content-Type: application/json' http://localhost:8080/skycare/_design/escorts -d @designDoc_escorts.json

# Create the initial data records
curl -X POST -H 'Authorization:Basic YWRtaW46cGFzcw==' -H 'Content-Type: application/json' http://localhost:8080/skycare/_bulk_docs -d @initial_data.json
