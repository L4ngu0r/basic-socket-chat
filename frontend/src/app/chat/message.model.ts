import {Room} from './room.model';

export class Message {
  value: string;
  timestamp: number;
  username: string;
  room: Room;
}
