# Build stage
FROM node:14 AS build

WORKDIR /app/

COPY . /app/

RUN npm install --no-audit --no-progress
RUN npm run build

# App stage
FROM node:14

ENV API_PORT=3000
ENV MEDIA_FOLDER='/app/medias'
ENV DISCORD_TOKEN=''

EXPOSE 3000

WORKDIR /app/

# Retrieve node_modules folder from previous stage to speed up this one
COPY --from=build /app/node_modules/ ./node_modules/
COPY --from=build /app/package.json .
# Retrieve build output from previous stage
COPY --from=build /app/dist/ ./dist/

# Remove npm dev dependencies
RUN npm prune --production

CMD npm run start
