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
            console.log(inviteCode);
            // let invite = true;
            if (inviteCode != null) {
                (<any>window).onSignIn = (function(googleUser) {
                    let profile = googleUser.getBasicProfile();
                    console.log('Name: ' + profile.getName());
                    let idToken = googleUser.getAuthResponse().id_token;
                    localStorage.setItem('google_id_token', idToken);

                    this.reversiService.acceptInvite(idToken, inviteCode, (res, err) => {
                        if (err != null) {
                            console.log(err);
                            return;
                        }
                        console.log(res);
                        localStorage.setItem('reversiAccessToken', res.accessToken);
                        window.location.assign('/play?game=' + res.invite.game);

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
