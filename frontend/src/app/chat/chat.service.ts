import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class ChatService {

  private socketServerUrl = 'http://localhost:3001';
  private socket = io(this.socketServerUrl);

  constructor(private http: Http) { }

  getMsgForRoom(room) {
    return this.http.get(`${this.socketServerUrl}/msg/${room}`)
        .map((res: Response) => {
          return res.json() || {};
        })
        .catch((error: any) => {
          return Observable.throw(error);
        });
  }

  getRooms() {
    return new Observable(observer => {
      this.socket.on('rooms', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
  }

  listenToNewUser() {
    return new Observable(observer => {
      this.socket.on('user_joined', (data) => {
        observer.next(data);
      });
    });
  }

  listenToUserLeft() {
    return new Observable(obs => {
      this.socket.on('user_left', (data) => {
        obs.next(data);
      });
    });
  }

  listenToAckNewMessage() {
    return new Observable(obs => {
      this.socket.on('ack_new_msg', (msg) => {
        console.log('ack_new_msg');
        obs.next(msg);
      });
    });
  }

  sendMessage(message) {
    this.socket.emit('new_msg', message);
  }

  sendNewUser(user) {
    this.socket.emit('new_user', user);
  }

  changeRoom(oldRoom, newRoom) {
    this.socket.emit('switch_room', {
      oldRoom: oldRoom,
      newRoom: newRoom
    });
  }

}
