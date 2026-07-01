# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

# copy node_modules (includes generated Prisma client) and compiled dist from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

EXPOSE 4000

CMD ["npm", "run", "start"]