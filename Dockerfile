FROM node:12
WORKDIR /home/cartographer
COPY . .
RUN npm install
CMD ["node", "bot.js"]