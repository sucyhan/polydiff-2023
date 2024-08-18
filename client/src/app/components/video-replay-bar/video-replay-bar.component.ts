import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StateGameService } from '@app/services/game/state.game.service';
import { ReplayService } from '@app/services/replay.service';
import { REPLAY_SPEED, TIME } from '@common/constants';

@Component({
    selector: 'app-video-replay-bar',
    templateUrl: './video-replay-bar.component.html',
    styleUrls: ['./video-replay-bar.component.scss'],
})
export class VideoReplayBarComponent implements AfterViewInit {
    @ViewChild('speed1') speed1x: ElementRef<HTMLButtonElement>;
    @ViewChild('speed2') speed2x: ElementRef<HTMLButtonElement>;
    @ViewChild('speed4') speed4x: ElementRef<HTMLButtonElement>;
    @Input() time: number = 0;

    constructor(private readonly videoService: ReplayService, private readonly stateGameService: StateGameService) {}

    ngAfterViewInit() {
        this.stateGameService.timeChanged.subscribe((time: number) => {
            const percent = 100;
            this.time = this.videoService.percentOfTimePassed();
            if (this.videoService.getEndTime() === time) {
                this.time = percent;
            }
        });
    }

    playVideo() {
        this.videoService.play();
        return;
    }

    pauseVideo() {
        this.videoService.stop();
        return;
    }

    replayVideo() {
        this.videoService.replay();
        return;
    }

    replay1x() {
        this.speed1x.nativeElement.style.color = '#2c974b';
        this.speed2x.nativeElement.style.color = '#000000';
        this.speed4x.nativeElement.style.color = '#000000';
        this.videoService.changeSpeed(TIME.REPLAY_TIME);
        return;
    }

    replay2x() {
        this.speed2x.nativeElement.style.color = '#2c974b';
        this.speed1x.nativeElement.style.color = '#000000';
        this.speed4x.nativeElement.style.color = '#000000';
        this.videoService.changeSpeed(TIME.REPLAY_TIME / REPLAY_SPEED.FASTER_2X);
        return;
    }

    replay4x() {
        this.speed4x.nativeElement.style.color = '#2c974b';
        this.speed1x.nativeElement.style.color = '#000000';
        this.speed2x.nativeElement.style.color = '#000000';
        this.videoService.changeSpeed(TIME.REPLAY_TIME / REPLAY_SPEED.FASTER_4X);
        return;
    }
}
