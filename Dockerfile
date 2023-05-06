FROM node:18 as build

ENV API_PORT=3000
ENV MEDIA_FOLDER='/app/medias'
ENV DISCORD_TOKEN=''
ENV DISCORD_APP_ID=''
ENV DISCORD_PUBLIC_KEY=''

EXPOSE 3000

WORKDIR /app/

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY patches/ patches/

RUN yarn postinstall

COPY . ./

RUN yarn build


FROM node:18 as run

WORKDIR /app/

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json .

RUN ls -l

CMD node .
