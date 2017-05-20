/**
 * APP-CHAT-SERVER
 */

const restify = require('restify'),
  redis = require('redis'),
  ent = require('ent'),
  dotenv = require('dotenv'),
  Promise = require('bluebird'),
  server = restify.createServer({
    name: 'SocketServer',
  });

dotenv.load();
server.use(restify.CORS());

/**
 *  REDIS
 */

Promise.promisifyAll(redis.RedisClient.prototype);
const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

client.on('connect', () => {
  console.log(`Connected to Redis server on ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
});

client.on("error", (err) => {
  console.log("Error " + err);
});

/**
 *  WEB SOCKET
 */

const io = require('socket.io')(server.server);

const defaultRoom = 'general';
const rooms = [
  { name : 'general', nbUsers : 0},
  { name : 'private', nbUsers : 0}
];

io.on('connection', (socket) => {
  socket.emit('rooms', {
  rooms: rooms
});

socket.on('new_user', (s) => {
  console.log('new_user');
  console.log(s);
  rooms[0].nbUsers++;
  socket.join(defaultRoom);
  io.in(defaultRoom).emit('user_joined','[User] ' + s.username + ' joined in room #' + s.room.name + ' !!');
  io.emit('rooms', {
    rooms: rooms
  })
});

socket.on('switch_room', (s) => {
  console.log('switch_room');
  console.log(s);
  rooms[getRoomIndex(s.oldRoom.name)].nbUsers--;
  socket.leave(s.oldRoom);
  rooms[getRoomIndex(s.newRoom.name)].nbUsers++;
  socket.join(s.newRoom);
  io.in(s.oldRoom).emit('user_left', '[User] left room : ' + s.oldRoom.name);
  io.in(s.newRoom).emit('user_joined', '[User] joined room : ' + s.newRoom.name);
  io.emit('rooms', {
    rooms: rooms
  })
});

socket.on('new_msg', (s) => {
  console.log('New message received');
  console.log(s);
  let key = 'msg-' + s.room.name + '-' + s.timestamp + '-' + ent.encode(s.username);
  client.set(key, ent.encode(s.value), redis.print);
  io.to(s.room.name).emit('ack_new_msg', s);
});

socket.on('pre_disconnect', (s) => {
  console.log('pre_disconnect');
  console.log(s);
  rooms[getRoomIndex(s)].nbUsers--;
  io.emit('rooms', {
    rooms: rooms
  })
});

socket.on('disconnect', () => {
  console.log('disconnect!!!');
  io.emit('user_disconnected', '[User] disconnected...');
});

socket.on('error', err => {
  console.error(err);
});

});

/**
 * Get room index
 * @param name
 * @returns {number}
 */
function getRoomIndex(name){
  return rooms.findIndex(r => {
    return r.name === name;
  });
}

/**
 * Get all the keys (Redis) for a room
 * @param room
 * @returns {Promise.<TResult>}
 */
function getAllKeysFromRoom(room){
  return client.keysAsync(`msg-${room}-*`)
    .then(resQuery => {
      return resQuery;
    })
    .catch(err => console.error(err));
}

/**
 * Get the key's value
 * @param key
 * @returns {Promise.<TResult>}
 */
function getMsgFromKey(key){
  return client.getAsync(key)
    .then(resKey => {
      return resKey;
    })
    .catch(err => console.error(err));
}

/**
 *
 * @param list
 * @returns {Promise.<*>}
 */
function getMsgFromKeyList(list){
  return Promise.all(
    list.map(element => {
      return getMsgFromKey(element)
        .then(msg => {
          return {
            key: element,
            msg : msg
          };
        });
    }));
}

/**
 * SERVER ROUTING
 */

/**
 * Get all messages for one room
 */
server.get('/msg/:room', (req, res) => {
  getAllKeysFromRoom(req.params.room)
    .then(keys => {
      console.log(`msg from room : ${req.params.room}`);
      getMsgFromKeyList(keys)
        .then(messages => {
          res.send(messages);
        })
        .catch(err => {
          res.status(500);
          res.send({ 'Error' : 'An error occurred. ' + err});
        })
    });
});

server.listen(3001, () => {
  console.log('socket.io server listening at %s', server.url);
});