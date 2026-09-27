FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY *.js ./
ENV PORT=3030 DATA_DIR=/data VERGER_AUTH_DB=/data/authority.sqlite VERGER_COOKIE_SECURE=true
VOLUME ["/data"]
EXPOSE 3030
CMD ["node", "server.js"]
