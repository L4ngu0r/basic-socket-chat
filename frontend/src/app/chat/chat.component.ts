import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {ChatService} from './chat.service';
import {Room} from './room.model';
import {Message} from './message.model';
import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/take';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  providers: [ ChatService ]
})
export class ChatComponent implements OnInit, OnDestroy {

  @ViewChild('textMessage') textMessage;
  connection;
  rooms = Array<Room>();
  user = {
    username: 'Toto',
    room: {
      name: 'tous',
      nbUsers: 0
    }
  };
  messages = Array<Message>();
  isConnected = false;

  constructor(private chatService: ChatService) { }

  formatMessages(msgArray) {
    msgArray.forEach(element => {
      const key = ChatComponent.parseKey(element.key);
      this.messages.push({
        value: element.msg,
        timestamp: key.timestamp,
        username: key.username,
        room: key.room
      });
    });
    this.messages.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });
  }

  static parseKey(key) {
    // 'msg-general-1482400689218-Toto'
    const splitMsg = key.split('-');
    return {
      timestamp: splitMsg[2],
      username: splitMsg[3],
      room: splitMsg[1]
    };
  }

  ngOnInit() {
    // Init connection to web socket server and get list of rooms
    this.connection = this.chatService.getRooms().subscribe(
      (res: any) => {
        this.rooms = res.rooms;
        if (!this.isConnected) {
          this.connect();
        }
      }
    );

    // Listener
    this.chatService.listenToNewUser().subscribe(
      (res: string) => {
        this.messages.push({
          value: res,
          timestamp: new Date().getTime(),
          username: 'Bot',
          room: this.user.room
        });
      }
    );
    this.chatService.listenToUserLeft().subscribe(
      (res: string) => this.messages.push({
        value: res,
        timestamp: new Date().getTime(),
        username: 'Bot',
        room: this.user.room
      })
    );
    this.chatService.listenToAckNewMessage().subscribe(
      (res: Message) => this.messages.push(res)
    );

    // Get previous message for general room
    this.chatService.getMsgForRoom('general').subscribe(
      res => this.formatMessages(res)
    );
  }

  ngOnDestroy() {
    this.connection.unsubscribe();
  }

  update(value: string) {
    console.log(this.textMessage);
    if (value) {
      this.textMessage.nativeElement.value = '';
      const message = {
        value: value,
        timestamp: new Date().getTime(),
        username: this.user.username,
        room: this.user.room
      };
      this.chatService.sendMessage(message);
    }
  }

  connect() {
    this.user.room = this.rooms[0];
    this.isConnected = true;
    this.chatService.sendNewUser(this.user);
  }

  switchRoom(oldRoom, newRoom) {
    this.user.room = newRoom;
    this.chatService.changeRoom(oldRoom, newRoom);
    this.messages = [];
    this.chatService.getMsgForRoom(newRoom.name).subscribe(
      res => this.formatMessages(res)
    );
  }
}
