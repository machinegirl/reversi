import { Injectable } from '@angular/core';
import {ReversiService} from './reversi.service';

@Injectable()
export class WebsocketService {

  public wsStatus: string;
  public sock: any;
  public reversiService: any;
  public websocketConnected: boolean = false;

	constructor(reversiService: ReversiService) {
		this.reversiService = reversiService;
	}

  init() {
	//   this.reversiService = ReversiService;
	  this.reversiService.init();
	  this.wsStatus = 'not connected';

	  let address = document.location.host.split(':')[0];
	  let sockAddr;

	  let tryConnecting = (function() {

		this.wsStatus = 'connecting...';
		if (address !== 'reversi-2016.appspot.com') {
			sockAddr = 'ws://' + address + ':8055';
		} else {
			sockAddr = 'wss://104.196.159.79:8056';
		}

		console.log('connecting to ' + sockAddr + ' ...');

		this.sock = new WebSocket(sockAddr, 'rust-websocket');
		this.reversiService.sockHandle = this.sock;

		this.sock.onopen = (function(evt) {
			if (this.sock.readyState === 1) {
				this.websocketConnected = true;
				this.connected = true;
				this.wsStatus = 'connected';
				console.log('connected to ' + sockAddr);
				this.sock.send(JSON.stringify({'cmd': 'msg', 'msg': 'client socket opened'}));
				// ReversiService.startGame(sock);
			}
		}).bind(this);

		this.sock.onmessage = (function(e) {
			console.log('websocket server msg:');
			console.log(e.data);

			let msg = JSON.parse(e.data);

			switch (msg.cmd) {
			case 'login':

				if (!msg.success) {
					console.log('backend login failed');
					return;
				}

				console.log('backend login succeeded');
				this.sock.onclose = undefined;
				window.location.assign('/dashboard');

				break;

			case 'logged_in':

				if (!msg.status) {
					console.log('not logged in');
					window.location.assign('/');
					return;
				}

				console.log('logged in!');
				break;

			case 'new_game':
				window.location.assign('/play?id=' + msg.id);
				break;

			case 'load_game':
				this.reversiService.setupGame(msg.game);
				break;

			// case 'current_games':
			// 	break;

      case 'check_move': {
        if (msg.valid) {
          this.reversiService.drawGameBoard(this.reversiService.game.board);
        } else {
          console.log('backend move check failed!')
          let game = this.reversiService.game;
          game.player_turn = (game.player_turn + 1)%2;
          game.pieces[game.player_turn] = game.pieces[game.player_turn] +1;
          //backend will return last valid game board
          //set gameboard to returned gameboard
        }
        break;
      }

			default:
				console.log('websocket server msg not understood');
			}

	  }).bind(this);

		this.sock.onclose = (function() {
			console.log('connection to ' + sockAddr + ' closed');
			window.setTimeout(tryConnecting.bind(this), 5000);
			this.websocketConnected = false;
		}).bind(this);

	}).bind(this);

	window.setTimeout(tryConnecting.bind(this), 5000);

  }
}
