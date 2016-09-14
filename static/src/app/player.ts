import {Component, OnInit} from '@angular/core';
import {ReversiService} from './reversi.service';

@Component({
  selector: 'Player',
  template: require('./player.html'),
  providers: []
})
export class Player implements OnInit {

	public path: string;

	constructor(private reversiService: ReversiService) {

	}

	ngOnInit() {
        this.reversiService.init(() => {

        });
	}

	newGame() {
    // Send id_token to AWS/play
	}
}
