# App-chat-server

##### Prérequis

Redis server up and running. Default host : 127.0.0.1 and port : 6379
You can use Docker :

```
docker run -p 6379:6379 -t redis:latest
```

You can change Redis config in [.env](.env) file

Default value : 
```
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

#### Install

```
npm i
```

#### Run dev mode

```
npm run dev
```

#### Run prod mode

```
npm start
```