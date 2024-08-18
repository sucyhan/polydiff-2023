import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { ChatComponent } from '@app/components/chat/chat.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { VideoReplayBarComponent } from '@app/components/video-replay-bar/video-replay-bar.component';
import { ControllerGameService } from '@app/services/game/controller.game.service';
import { StateGameService } from '@app/services/game/state.game.service';
import { ReplayService } from '@app/services/replay.service';
import { GAME_STATE } from '@common/constants';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    @ViewChild('playArea') playArea: PlayAreaComponent;
    @ViewChild('chat') chat: ChatComponent;
    @ViewChild('video') video: ElementRef<VideoReplayBarComponent>;
    @Input() show: boolean = false;

    constructor(
        private readonly controllerGameService: ControllerGameService,
        private videoService: ReplayService,
        private readonly stateGameService: StateGameService,
    ) {}

    @HostListener('window:keyup', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        if (event.target !== this.chat.messageInput.nativeElement) {
            this.playArea.buttonDetect(event);
        }
    }

    ngOnInit() {
        this.stateGameService.gameEnded = false;
        this.stateGameService.gameState = GAME_STATE.IN_GAME;
        this.stateGameService.replayEvents = [];
        this.controllerGameService.showVideoBar.subscribe(() => {
            this.show = true;
            this.videoService.getData();
            this.stateGameService.gameEnded = true;
            this.videoService.play();
        });
        return;
    }
    isSinglePlayer(): boolean {
        return this.stateGameService.isSinglePlayer();
    }
}
