FROM consul:latest

RUN apk add --no-cache py-pip ca-certificates wget nodejs
RUN mkdir -p /src
WORKDIR /src

COPY package.json yarn.lock /src/
RUN yarn install

COPY . /src

ENTRYPOINT ["/src/start.sh"]
