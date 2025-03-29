
# Use Node.js 18 as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire source code into the container
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variables (optional)
ENV NODE_ENV=production

# Start the application
CMD ["node", "app.js"]
