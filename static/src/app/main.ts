import { Component, OnInit, Input} from '@angular/core';
// import { Http, Response, Headers, RequestOptions } from '@angular/http';
// import { Observable } from 'rxjs/Observable';
import {Header} from './header';
import {ReversiService} from './reversi.service';


@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [],
  directives: [Header]
})
export class Main implements OnInit {

  @Input() public main: Main;

  constructor(private reversiService: ReversiService) {
	  console.log('main controller started');
  }

	ngOnInit() {
        this.reversiService.init(() => {
            let inviteCode = this.reversiService.getParameterByName('invite', false);
            if (inviteCode != null) {
                (<any>window).onSignIn = (function(googleUser) {
                    let profile = googleUser.getBasicProfile();
                    console.log('Name: ' + profile.getName());
                    let idToken = googleUser.getAuthResponse().id_token;
                    localStorage.setItem('google_id_token', idToken);

                    this.reversiService.login(idToken, (message) => {
                        if (message.success) {
                            localStorage.setItem('reversiAccessToken', message.accessToken);
                            this.reversiService.acceptInvite(inviteCode, (invite) => {
                                window.location.assign('/play?id=' + invite.game);
                                return;
                            });
                        }
                        else {
                            console.log(message);
                        }

                    });
               }).bind(this);
            } else {
                (<any>window).onSignIn = (function(googleUser) {
                    let profile = googleUser.getBasicProfile();
                    console.log('Name: ' + profile.getName());
                    let idToken = googleUser.getAuthResponse().id_token;
                    localStorage.setItem('google_id_token', idToken);

                    this.reversiService.login(idToken, (message) => {
                        if (message.success) {
                            localStorage.setItem('reversiAccessToken', message.accessToken);
                            window.location.assign('/dashboard');
                        }
                        else {
                            console.log(message);
                        }
                    });
               }).bind(this);
            }
       });
    }

}
