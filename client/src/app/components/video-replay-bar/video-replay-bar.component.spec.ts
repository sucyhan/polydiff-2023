import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StateGameService } from '@app/services/game/state.game.service';
import { ReplayService } from '@app/services/replay.service';
import { GAME_EVENTS } from '@common/constants';
import { Subject } from 'rxjs';
import { VideoReplayBarComponent } from './video-replay-bar.component';

class MockStateGameService {
    time: number = 0;
    timeChanged = new Subject<number>();
}

class MockReplayService {
    play() {
        return;
    }
    stop() {
        return;
    }
    replay() {
        return;
    }
    changeSpeed() {
        return;
    }
    percentOfTimePassed() {
        return 0;
    }
    getEndTime() {
        return 0;
    }
}

describe('VideoReplayBarComponent', () => {
    let component: VideoReplayBarComponent;
    let fixture: ComponentFixture<VideoReplayBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoReplayBarComponent],
            imports: [MatProgressBarModule, MatIconModule],
            providers: [
                {
                    provide: StateGameService,
                    useClass: MockStateGameService,
                },
                {
                    provide: ReplayService,
                    useClass: MockReplayService,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VideoReplayBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call play', () => {
        const spy = spyOn(component['videoService'], 'play').and.returnValue();
        component.playVideo();
        expect(spy).toHaveBeenCalled();
    });

    it('should call stop', () => {
        const spy = spyOn(component['videoService'], 'stop').and.returnValue();
        component.pauseVideo();
        expect(spy).toHaveBeenCalled();
    });

    it('should call replay', () => {
        const spy = spyOn(component['videoService'], 'replay').and.returnValue();
        component.replayVideo();
        expect(spy).toHaveBeenCalled();
    });

    it('should call changeSpeed', () => {
        const spy = spyOn(component['videoService'], 'changeSpeed').and.returnValue();
        component.replay1x();
        expect(spy).toHaveBeenCalled();
    });

    it('should call changeSpeed', () => {
        const spy = spyOn(component['videoService'], 'changeSpeed').and.returnValue();
        component.replay2x();
        expect(spy).toHaveBeenCalled();
    });

    it('should call changeSpeed', () => {
        const spy = spyOn(component['videoService'], 'changeSpeed').and.returnValue();
        component.replay4x();
        expect(spy).toHaveBeenCalled();
    });

    it('ngAfterViewInit should call this.videoService.percentOfTimePassed()', () => {
        component['videoService'].gameEvents = [{ type: GAME_EVENTS.MESSAGE, time: 1, eventData: {} }];
        const spy = spyOn(component['videoService'], 'percentOfTimePassed').and.returnValue(1);
        component.ngAfterViewInit();
        component['stateGameService'].timeChanged.next(0);
        expect(spy).toHaveBeenCalled();
    });
});
