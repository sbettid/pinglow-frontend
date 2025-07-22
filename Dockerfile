# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build


# ---------- Production stage ----------
FROM nginx:stable-alpine

# Copy built app to nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx config and replace with custom one (optional)
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]