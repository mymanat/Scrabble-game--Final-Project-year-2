import { createAction, props } from '@ngrx/store';
import { Log2990Objective } from 'common/interfaces/log2990-objectives';

export const refreshObjectiveState = createAction(
    '[Game Objective] Refresh Objective State',
    props<{ publicObjectives: Log2990Objective[]; privateObjectives: Log2990Objective[] }>(),
);
