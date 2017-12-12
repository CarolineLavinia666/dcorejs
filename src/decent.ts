import { setLibRef } from './helpers';
import { Core } from './core';

export class DecentError {
    static app_not_initialized = 'app_not_initialized';
    static app_missing_config = 'app_missing_config';
}

export interface DecentConfig {
    decent_network_wspaths: string[]
    chain_id: string
}

export class Decent {
    // private static _config: DecentConfig;
    private static _core: Core;
    private static _decentjs_lib: any;

    public static get core(): Core | null {
        if (!Decent._core) {
            throw new Error(DecentError.app_not_initialized);
        }
        return Decent._core;
    }



    public static initialize(config: DecentConfig, decentjs_lib: any): void {
        this._decentjs_lib = decentjs_lib;
        setLibRef(decentjs_lib);

        if (config.decent_network_wspaths[0] === '' || config.chain_id === '') {
            throw new Error(DecentError.app_missing_config);
        }

        if (Decent._core) {
            return;
        }

        Decent._core = Core.create(
            {
                decent_network_wspaths: config.decent_network_wspaths,
                chain_id: config.chain_id
            },
            this._decentjs_lib.Apis,
            this._decentjs_lib.ChainConfig,
            this._decentjs_lib.ChainStore);
    }

    private constructor() {
    }
}
