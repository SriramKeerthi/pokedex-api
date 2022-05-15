FROM node:alpine

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .
RUN yarn install
RUN yarn build

EXPOSE 7653 80
CMD [ "yarn", "start" ]
