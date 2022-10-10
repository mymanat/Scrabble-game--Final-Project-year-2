import { GameConfig } from '@app/classes/game-config';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { Service } from 'typedi';

const configsPath = 'assets/game-configs';

@Service()
export class GameConfigService {
    configs: GameConfig[];

    constructor() {
        this.configs = [];
    }

    async init() {
        this.configs = [];
        const paths = await readdirSync(configsPath);
        paths.forEach(async (fileName) => {
            const json = await readFileSync(path.join(configsPath, fileName), { encoding: 'utf8' });
            const config = JSON.parse(json);
            this.configs.push(config);
        });
    }

    getConfigFromName(name: string): GameConfig | Error {
        const config = this.configs.find((c) => c.name === name);
        if (config === undefined) return new Error('config not found');
        return config;
    }
}
