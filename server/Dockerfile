FROM node:24-alpine AS deps

WORKDIR /app

COPY server/package.json server/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

FROM node:24-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY server .
RUN corepack enable && yarn build

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8097
ENV HIDDEN_BITES_DATA_ROOT=/app/datasets/derived

WORKDIR /app

COPY server/package.json server/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --production=true && yarn cache clean
COPY --from=build /app/dist ./dist
COPY datasets/derived ./datasets/derived

EXPOSE 8097

CMD ["node", "dist/main.js"]
