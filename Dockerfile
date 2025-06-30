# --- Step 1: Build Stage ---
    FROM node:22 AS builder
    WORKDIR /apps/VMS

    # Copy all project files
    COPY . .

    # Copy package files and install dependencies
    COPY package.json package-lock.json ./
    RUN npm install

    # Generate Prisma Client
    RUN npx prisma generate
    
    # Build the Next.js app
    RUN npm run build
    
    # --- Step 2: Production Stage ---
    FROM node:22 AS production
    WORKDIR /apps/VMS
    
    # Copy built files and dependencies from the builder stage
    COPY --from=builder /apps/VMS ./
    
    # Ensure OpenSSL is installed
    RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
    
    # Expose the port your app runs on
    EXPOSE 3000
    
    # Run the application
    CMD ["npm", "start"]