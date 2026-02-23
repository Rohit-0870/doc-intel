# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pass build-time variables if needed (see section below)
# ARG REACT_APP_API_URL
# ENV REACT_APP_API_URL=$REACT_APP_API_URL
# RUN npm run build
RUN npm run build || (echo "Build failed!" && exit 1)
RUN ls -la /app


# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the build output to replace the default nginx contents
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: Add a custom nginx config to handle React Router paths
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

#TODO - test line added ti trigger builds. Remove this line later