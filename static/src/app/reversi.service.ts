import { Injectable} from '@angular/core';
import {JwtHelper} from 'angular2-jwt';


@Injectable()
export class ReversiService {

	// public gameBoard: Array<Array<number>>;
	public sockHandle: any;
	public game: any;
	public numPieces0: number;
	public numPieces1: number;
	jwtHelper: JwtHelper = new JwtHelper();



	init() {
		console.log('reversi service started');

		// this.gameBoard = [
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0]
		// ];

		if (window.location.pathname === '/play') {
			let c = <HTMLCanvasElement> document.getElementById('gameBoard');
			if (typeof c !== 'undefined') {
				let ctx = <CanvasRenderingContext2D> c.getContext('2d');
				// console.log(ctx);
				ctx.fillStyle = '#0f8f2f';
				ctx.fillRect(0, 0, 400, 400);

				// this.drawGameBoard(gameBoard);
			} else {
				// console.log('c: ' + c);
			}
		}
	}

	drawGameBoard(gameBoard) {
		let c = <HTMLCanvasElement> document.getElementById('gameBoard');
		let ctx = <CanvasRenderingContext2D> c.getContext('2d');
		let h = c.height;
		ctx.fillStyle = '#0f8f2f';
		ctx.fillRect(0, 0, h, h);
		let tileH = h / 8;
		let startX = 0;
		let startY = 0;
		ctx.strokeStyle = '#000000';
		for (let i = 0; i < gameBoard.length; i++) {
			for (let j = 0; j < gameBoard[i].length; j++) {
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(startX + tileH, startY);
				ctx.lineTo(startX + tileH, startY + tileH);
				ctx.lineTo(startX, startY + tileH);
				ctx.lineTo(startX, startY);
				ctx.stroke();
				if (gameBoard[i][j] !== 0) {
					ctx.beginPath();
					ctx.arc(startX + (tileH / 2), startY + (tileH / 2), tileH / 2.2, 0, 2 * Math.PI);

					if (gameBoard[i][j] === 1) {
						ctx.fillStyle = '#FFFFFF';
					} else {
						ctx.fillStyle = '#000000';
					}
					ctx.fill();
				}

				startX += tileH;

			}
			startY += tileH;
			startX = 0;
		}
	}

	// newGame() {
	// 	let gameBoard = [];
	// 	for (let i = 0; i < 8; i++) {
	// 		let row = [];
	// 		for (let j = 0; j < 8; j++) {
	// 			row.push(0);
	// 		}
	// 		gameBoard.push(row);
	// 	}
	// 	this.gamed = gameBoard;
	// }

	loadGame(id) {
		let idToken = localStorage.getItem('google_id_token');

		this.sockHandle.send(JSON.stringify({
			'cmd': 'load_game',
			'id_token': idToken,
			'id': id
		}));

	}

	setupGame(game) {
		this.game = game;
		this.drawGameBoard(this.game.board);

	}

	checkTurn() {
		let idToken = this.jwtHelper.decodeToken(localStorage.getItem('google_id_token')).sub;
		let playerTurn = this.game.player_turn;
		if (this.game.players[playerTurn] !== idToken) {
		  return false;
		} else {
		  return true;
	  }
	}

	checkMove(row, column) {
		let validMoves = [];
		// let idToken = this.jwtHelper.decodeToken(localStorage.getItem('google_id_token')).sub;
		if (this.game.pieces[this.game.player_turn] > 30) {
			console.log('player ' + this.game.player_turn + ': do opening move');
			if (this.game.player_turn === 0) {
				validMoves = [[3, 3], [4, 4]];
			} else if (this.game.player_turn === 1) {
				validMoves = [[4, 3], [3, 4]];
			}
		} else {
			console.log('make a real move');
			validMoves = this.validMoves();
		}
		for (let i = 0; i < <number>validMoves.length; i++) {
			if (validMoves[i][0] === row && validMoves[i][1] === column) {
				return true;
			}
		}

		return false;

	}

	validMoves() {
		let validMoves = [];
		let gameBoardLength: number = this.game.board.length;

		for (let i = 0; i < gameBoardLength; i++) {

		}

		return validMoves;
	}

}
