# ---------- Build stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY client/ .
RUN npm install

RUN npm run build


# ---------- Production Node.js server ----------
FROM node:22-alpine

WORKDIR /app

# Copy built Vue app
COPY --from=builder /app/dist ./dist

# Copy only required files to run the server
COPY server/ .

# Install only express-related deps (optional optimization)
RUN npm install

EXPOSE 80

CMD ["node", "app.js"]
