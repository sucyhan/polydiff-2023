import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigurationPageComponent } from '@app/pages/configuration-page/configuration-page.component';
import { CreationPageComponent } from '@app/pages/creation-page/creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { GameSelectionPageComponent } from '@app/pages/game-selection-page/game-selection-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { TimedWaitingPageComponent } from '@app/pages/timed-waiting-page/timed-waiting-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'classic/singlePlayer/:id', component: GamePageComponent },
    { path: 'classic/multiPlayer/:id/:room/:username', component: GamePageComponent },
    { path: 'timed/singlePlayer/:username', component: GamePageComponent },
    { path: 'timed/multiPlayer/:room/:username', component: GamePageComponent },
    { path: 'timed', component: TimedWaitingPageComponent },
    { path: 'config', component: ConfigurationPageComponent },
    { path: 'select', component: GameSelectionPageComponent },
    { path: 'create', component: CreationPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true, onSameUrlNavigation: 'reload' })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
