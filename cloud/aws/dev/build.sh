#!/bin/sh

cd server
rm -rf ./node_modules
sed -i 's/localhost:8080/10.0.1.35:8080/g' ./src/datasources/cloudant.datasource.json
npm install
npm run build

cd ../frontend
rm -rf ./node_modules
sed -i 's/3000/443/g' ./src/app/app.module.ts
npm install
npm install -g ionic
ionic build -c dev --engine browser
cp -r ./www/* ../server/public

cd ..
cp -r ./server/* .
rm -rf ./server ./frontend
mkdir ./uploadedFiles
touch ./uploadedFiles/placeholder.txt