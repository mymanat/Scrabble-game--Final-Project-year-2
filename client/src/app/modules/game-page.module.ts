import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BoardComponent } from '@app/components/board/board.component';
import { CellEmptyComponent } from '@app/components/cells/cell-empty/cell-empty.component';
import { CellLetterX2Component } from '@app/components/cells/cell-letter-x2/cell-letter-x2.component';
import { CellLetterX3Component } from '@app/components/cells/cell-letter-x3/cell-letter-x3.component';
import { CellStarComponent } from '@app/components/cells/cell-star/cell-star.component';
import { CellWordX2Component } from '@app/components/cells/cell-word-x2/cell-word-x2.component';
import { CellWordX3Component } from '@app/components/cells/cell-word-x3/cell-word-x3.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { EaselComponent } from '@app/components/easel/easel.component';
import { GamesObjectivesComponent } from '@app/components/games-objectives/games-objectives.component';
import { LetterComponent } from '@app/components/letter/letter.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { SkipTurnButtonComponent } from '@app/components/skip-turn-button/skip-turn-button.component';
import { SurrenderGameButtonComponent } from '@app/components/surrender-game-button/surrender-game-button.component';
import { BrowserEffects } from '@app/effects/browser.effects';
import { ChatEffects } from '@app/effects/chat.effects';
import { PlayerEffects } from '@app/effects/player.effects';
import { AppMaterialModule } from '@app/modules/material.module';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { BoardToListPipe } from '@app/pipes/board-to-list.pipe';
import * as boardReducer from '@app/reducers/board.reducer';
import * as chatReducer from '@app/reducers/chat.reducer';
import * as gameHistoryReducer from '@app/reducers/game-history.reducer';
import * as objectiveReducer from '@app/reducers/game-objective.reducer';
import * as gameReducer from '@app/reducers/game-status.reducer';
import * as leaderboardReducer from '@app/reducers/leaderboard.reducer';
import * as localSettingsReducer from '@app/reducers/local-settings.reducer';
import * as playerReducer from '@app/reducers/player.reducer';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { BackButtonDisableModule } from 'angular-disable-browser-back-button';

@NgModule({
    declarations: [
        GamePageComponent,
        BoardComponent,
        CellWordX2Component,
        CellWordX3Component,
        CellLetterX2Component,
        CellLetterX3Component,
        CellStarComponent,
        CellEmptyComponent,
        LetterComponent,
        ChatBoxComponent,
        EaselComponent,
        SurrenderGameButtonComponent,
        BoardToListPipe,
        SidebarComponent,
        ChatBoxComponent,
        SurrenderGameButtonComponent,
        SkipTurnButtonComponent,
        GamesObjectivesComponent,
    ],
    imports: [
        AppMaterialModule,
        CommonModule,
        BackButtonDisableModule.forRoot(),
        StoreModule.forFeature(gameReducer.gameStatusFeatureKey, gameReducer.reducer),
        StoreModule.forFeature(boardReducer.boardFeatureKey, boardReducer.reducer),
        StoreModule.forFeature(playerReducer.playerFeatureKey, playerReducer.reducer),
        StoreModule.forFeature(chatReducer.chatFeatureKey, chatReducer.reducer),
        StoreModule.forFeature(leaderboardReducer.leaderboardFeatureKey, leaderboardReducer.reducer),
        StoreModule.forFeature(localSettingsReducer.localSettingsFeatureKey, localSettingsReducer.reducer),
        StoreModule.forFeature(gameHistoryReducer.gameHistoryFeatureKey, gameHistoryReducer.reducer),
        StoreModule.forFeature(objectiveReducer.gameObjectiveFeatureKey, objectiveReducer.reducer),
        EffectsModule.forFeature([ChatEffects, PlayerEffects, BrowserEffects]),
    ],
})
export class GamePageModule {}
