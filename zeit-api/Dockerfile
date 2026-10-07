# --- Etapa 1: Build da Aplicação ---
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências
RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Gera o Prisma Client e faz o build do NestJS
RUN npx prisma generate
RUN npm run build

# --- Etapa 2: Produção---
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Copia a pasta node_modules já compilada do estágio anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Executa as migrations, o seed e depois sobe o servidor NestJS automaticamente
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/main"]