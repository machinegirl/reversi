import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'Player',
  template: require('./player.html'),
  providers: []
})
export class Player implements OnInit {

	public path: string;

	constructor() {
	}

	ngOnInit() {
        
	}

	newGame() {
    // Send id_token to AWS/play
	}
}
