# Stage 1: Build with Node
FROM node:18-alpine AS build

WORKDIR /app

# Copy package definition and install dependencies (none for now but keeps cache efficient)
COPY package.json package-lock.json* ./
RUN npm install || echo "No dependencies to install"

# Copy source and build scripts
COPY src ./src
COPY scripts ./scripts

# Build: copy src → dist
RUN npm run build

# Stage 2: Nginx for static hosting
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
