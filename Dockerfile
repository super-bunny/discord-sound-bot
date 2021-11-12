# Build stage
FROM node:16

ENV API_PORT=3000
ENV MEDIA_FOLDER='/app/medias'
ENV DISCORD_TOKEN=''
ENV DISCORD_APP_ID=''
ENV DISCORD_PUBLIC_KEY=''

EXPOSE 3000

WORKDIR /app/

COPY package.json yarn.lock ./

RUN yarn

COPY . ./

CMD yarn start
