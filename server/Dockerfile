FROM node:24-alpine AS deps

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY server .
RUN yarn build

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8097
ENV HIDDEN_BITES_DATA_ROOT=/app/datasets/derived

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY datasets/derived ./datasets/derived

EXPOSE 8097

CMD ["node", "dist/main.js"]
