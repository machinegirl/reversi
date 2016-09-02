import { Component, OnInit, Input} 	from '@angular/core';
import {Header} from './header';
import {Player} from './player';
import {ReversiService} from './reversi.service';

@Component({
  selector: 'Dashboard',
  template: require('./dashboard.html'),
  providers: [],
  directives: [Header, Player]
})
export class Dashboard implements OnInit {

	@Input() public dashboard: Dashboard;

	constructor(private reversiService: ReversiService) {
	}

	ngOnInit() {

        let idToken = localStorage.getItem('google_id_token');
        if (typeof idToken === 'undefined' || idToken === null) {
            window.location.assign('/');
            return;
        }

        this.reversiService.login(idToken, '/', false, () => {
            console.log('dashboard loaded');
        });
	}

	signOut() {
		console.log('signing out');
		(<any>window).gapi.load('client:auth2', this.authInit.bind(this));
	}

	authInit() {
		(<any>window).gapi.auth2.init({
			client_id: '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com',
			scopes: 'profile'
		});
		(<any>window).gapi.auth2.getAuthInstance().then(this.authCallback.bind(this));
	}

	authCallback(googleAuth) {
		localStorage.removeItem('google_id_token');
		googleAuth.signOut();
		window.location.assign('/');
	}

    play(id) {
        let url = 'play';
        if (id) {
            url += '?id=' + id;
        }
        window.location.assign(url);
    }

}
