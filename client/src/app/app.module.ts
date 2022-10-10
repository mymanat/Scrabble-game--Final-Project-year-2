import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import * as botNamesReducer from '@app/reducers/bot-names.reducer';
import * as dictionariesReducer from '@app/reducers/dictionaries.reducer';
import * as gameModeReducer from '@app/reducers/game-mode.reducer';
import * as gameReducer from '@app/reducers/game-status.reducer';
import * as roomReducer from '@app/reducers/room.reducer';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { BotAdminComponent } from './components/bot-name-admin/bot-name-admin.component';
import { BotNameFormDialogComponent } from './components/bot-name-form-dialog/bot-name-form-dialog.component';
import { ConfirmSurrenderDialogComponent } from './components/confirm-surrender-dialog/confirm-surrender-dialog.component';
import { DictionariesAdministratorComponent } from './components/dictionaries-administrator/dictionaries-administrator.component';
import { DictionaryFormDialogComponent } from './components/dictionary-form-dialog/dictionary-form-dialog.component';
import { GameHistoryTableComponent } from './components/game-history-table/game-history-table.component';
import { LeaderboardDialogComponent } from './components/leaderboard-dialog/leaderboard-dialog.component';
import { MultiConfigWindowComponent } from './components/multi-config-window/multi-config-window.component';
import { WaitingRoomComponent } from './components/waiting-room/waiting-room.component';
import { BotNamesEffects } from './effects/bot-names.effects';
import { DictionariesEffects } from './effects/dictionaries.effects';
import { GameHistoryEffects } from './effects/game-history.effects';
import { GameEffects } from './effects/game.effects';
import { LeaderboardEffects } from './effects/leaderboard.effects';
import { RoomEffects } from './effects/room.effects';
import { GamePageModule } from './modules/game-page.module';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { GameJoinPageComponent } from './pages/game-join-page/game-join-page.component';
import { GamePreparationPageComponent } from './pages/game-preparation-page/game-preparation-page.component';
import { GameSelectionPageComponent } from './pages/game-selection-page/game-selection-page.component';
import { MaterialPageComponent } from './pages/material-page/material-page.component';
import { SoloGameSettingsPageComponent } from './pages/solo-game-settings-page/solo-game-settings-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        MaterialPageComponent,
        ConfirmSurrenderDialogComponent,
        GameSelectionPageComponent,
        MultiConfigWindowComponent,
        GamePreparationPageComponent,
        WaitingRoomComponent,
        GameJoinPageComponent,
        SoloGameSettingsPageComponent,
        AdminPageComponent,
        GameHistoryTableComponent,
        DictionaryFormDialogComponent,
        DictionariesAdministratorComponent,
        BotAdminComponent,
        BotNameFormDialogComponent,
        LeaderboardDialogComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        StoreModule.forRoot({
            dictionaries: dictionariesReducer.reducer,
            room: roomReducer.reducer,
            gameStatus: gameReducer.reducer,
            gameMode: gameModeReducer.reducer,
            botNames: botNamesReducer.reducer,
        }),
        EffectsModule.forRoot([DictionariesEffects, RoomEffects, GameEffects, LeaderboardEffects, GameHistoryEffects, BotNamesEffects]),
        StoreDevtoolsModule.instrument({}),
        GamePageModule,
        ReactiveFormsModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
