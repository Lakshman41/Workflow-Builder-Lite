# Build frontend with API base URL pointing to backend
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Set backend URL at build time (Vite bakes it in)
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
