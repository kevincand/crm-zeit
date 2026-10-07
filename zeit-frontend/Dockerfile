# Stage 1: Build do Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Servir com Nginx
FROM nginx:alpine
# Nota: Ajuste 'zeit-crm' para o nome exato do seu projeto no package.json se necessário (geralmente dist/<nome-do-projeto>/browser)
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]