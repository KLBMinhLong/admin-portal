import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { API_URL } from '@core/tokens/config.token';
import { AuthService } from '../auth/auth.service';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private rxStomp: RxStomp;

  constructor(
    private authService: AuthService, 
    private loggingService: LoggingService
  ) {
    const baseUrl = inject(API_URL);
    this.rxStomp = new RxStomp();
    
    // Gateway URL is http://localhost:8000, so WS is ws://localhost:8000/ws
    const brokerURL = baseUrl.replace('http', 'ws').replace('/api/v1', '/ws');

    this.rxStomp.configure({
      brokerURL: brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${this.authService.token()}`
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      reconnectDelay: 5000,
      debug: (msg: string): void => {
        this.loggingService.debug(`[Websocket] ${msg}`);
      }
    });

    this.rxStomp.activate();
  }

  public watchRequestUpdates(requestId: number) {
    return this.rxStomp.watch(`/topic/requests/${requestId}`);
  }

  public watchUserNotifications(username: string) {
    return this.rxStomp.watch(`/topic/users/${username}/notifications`);
  }

  public deactivate() {
    this.rxStomp.deactivate();
  }
}
