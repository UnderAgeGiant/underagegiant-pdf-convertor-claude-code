FROM node:20-slim

# Install LibreOffice as root before switching users
RUN apt-get update && apt-get install -y \
  libreoffice \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Give the node user ownership of the working directory
RUN chown -R node:node /app

USER node

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
