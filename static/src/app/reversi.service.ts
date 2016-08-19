import { Injectable} from '@angular/core';

@Injectable()
export class ReversiService {

	public gameBoard: Array<Array<number>>;
	public sockHandle: any;
	public game: any;

	init() {
		console.log('reversi service started');

		this.gameBoard = [
			[1, 0, 0, 0, 0, 0, 0, 0],
			[0, 1, 0, 0, 0, 2, 0, 0],
			[0, 0, 2, 0, 0, 0, 1, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 1, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 2, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 1, 0, 0, 0]
		];

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
						ctx.fillStyle = '#000000';
					} else {
						ctx.fillStyle = '#FFFFFF';
					}
					ctx.fill();
				}

				startX += tileH;

			}
			startY += tileH;
			startX = 0;
		}
	}

	newGame() {
		let gameBoard = [];
		for (let i = 0; i < 8; i++) {
			let row = [];
			for (let j = 0; j < 8; j++) {
				row.push(0);
			}
			gameBoard.push(row);
		}
		this.gameBoard = gameBoard;
	}

	loadGame(id) {
			this.sockHandle.send(JSON.stringify({
				'cmd': 'load_game',
				'id': id
			}));

	}

}
