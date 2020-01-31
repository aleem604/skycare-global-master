FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
RUN chown -R node /usr/local/lib/node_modules && chown node /usr/local/bin
RUN apk add --no-cache make g++ python2 pkgconf cairo cairo-dev libjpeg-turbo-dev pango pango-dev pangomm pangomm-dev

WORKDIR /home/node/app

USER node

EXPOSE 3000 3001

ENTRYPOINT [ "node", "index.js" ]

HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 CMD wget --spider -q http://localhost:3000/ping || exit 1

COPY --chown=node:node ./server ./server
COPY --chown=node:node ./frontend ./frontend
COPY --chown=node:node ./cloud/aws/prod/build.sh ./

RUN mkdir -p ~/.npm && chown -R node ~/.npm
RUN chmod +x ./build.sh && ./build.sh
