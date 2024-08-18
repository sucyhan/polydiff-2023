import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EndGamePopupComponent } from '@app/components/end-game-popup/end-game-popup.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { AbandonPopupComponent } from './components/abandon-popup/abandon-popup.component';
import { ChatComponent } from './components/chat/chat.component';
import { ConstantsComponent } from './components/constants/constants.component';
import { DifferencePopupComponent } from './components/difference-popup/difference-popup.component';
import { GameCardComponent } from './components/game-card/game-card.component';
import { GeneralHeaderComponent } from './components/general-header/general-header.component';
import { HintsComponent } from './components/hints/hints.component';
import { HistoryPopupComponent } from './components/history-popup/history-popup.component';
import { JoinGamePopupComponent } from './components/join-game-popup/join-game-popup.component';
import { SingleCanvasComponent } from './components/single-canvas/single-canvas.component';
import { ToolBoxComponent } from './components/tool-box/tool-box.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { UserNameInputComponent } from './components/user-name-input/user-name-input.component';
import { VideoReplayBarComponent } from './components/video-replay-bar/video-replay-bar.component';
import { WaitingPopupComponent } from './components/waiting-popup/waiting-popup.component';
import { ConfigurationPageComponent } from './pages/configuration-page/configuration-page.component';
import { CreationPageComponent } from './pages/creation-page/creation-page.component';
import { GameSelectionPageComponent } from './pages/game-selection-page/game-selection-page.component';
import { TimedWaitingPageComponent } from './pages/timed-waiting-page/timed-waiting-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        GameCardComponent,
        HintsComponent,
        ConfigurationPageComponent,
        GameSelectionPageComponent,
        GeneralHeaderComponent,
        CreationPageComponent,
        UserNameInputComponent,
        PlayAreaComponent,
        TopBarComponent,
        ToolBoxComponent,
        DifferencePopupComponent,
        EndGamePopupComponent,
        WaitingPopupComponent,
        SingleCanvasComponent,
        JoinGamePopupComponent,
        AbandonPopupComponent,
        ChatComponent,
        TimedWaitingPageComponent,
        ConstantsComponent,
        VideoReplayBarComponent,
        HistoryPopupComponent,
    ],
    imports: [
        AppRoutingModule,
        AppMaterialModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatDialogModule,
        MatProgressBarModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
