FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . /app
RUN npm run build
CMD ["npm", "run", "start"]