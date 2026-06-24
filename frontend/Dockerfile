# --- Build aşaması ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/pi4
ARG VITE_BASE_PATH=/pi4/

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# --- Serve aşaması ---
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# React Router için: bilinmeyen path'ler index.html'e döner
# index.html için no-cache, assets için uzun süreli cache
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
