import {ApiModule} from './ApiModule';
import {DatabaseApi} from '../api/database';
import {DatabaseOperations} from '../api/model/database';
import {SubscriptionError, SubscriptionObject} from '../model/subscription';
import {Operations} from '../model/transaction';
import {DCoreAssetObject} from '../model/asset';
import {Transaction} from '../transaction';
import {Asset} from '../model/account';
import {ApiConnector} from '../api/apiConnector';

export class SubscriptionModule extends ApiModule {
    private connector: ApiConnector;

    constructor(dbApi: DatabaseApi, connector: ApiConnector) {
        super(dbApi);
        this.connector = connector;
    }

    public listActiveSubscriptionByConsumer(consumerId: string, count: number = 100): Promise<SubscriptionObject[]> {
        return new Promise<SubscriptionObject[]>((resolve, reject) => {
            const operation = new DatabaseOperations.ListActiveSubscriptionsByConsumer(consumerId, count);
            this.dbApi.execute(operation)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(this.handleError(SubscriptionError.database_operation_failed, err)));
        });
    }

    public listSubscriptionsByConsumer(consumerId: string, count: number = 100): Promise<SubscriptionObject[]> {
        return new Promise<SubscriptionObject[]>((resolve, reject) => {
            const operation = new DatabaseOperations.ListSubscriptionsByConsumer(consumerId, count);
            this.dbApi.execute(operation)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(this.handleError(SubscriptionError.database_operation_failed, err)));
        });
    }

    public listActiveSubscriptionsByAuthor(authorId: string, count: number = 100): Promise<SubscriptionObject[]> {
        return new Promise<SubscriptionObject[]>((resolve, reject) => {
            const operation = new DatabaseOperations.ListActiveSubscriptionsByAuthor(authorId, count);
            this.dbApi.execute(operation)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(this.handleError(SubscriptionError.database_operation_failed, err)));
        });
    }

    public listSubscriptionsByAuthor(authorId: string, count: number = 100): Promise<SubscriptionObject[]> {
        return new Promise<SubscriptionObject[]>((resolve, reject) => {
            const operation = new DatabaseOperations.ListSubscriptionsByConsumer(authorId, count);
            this.dbApi.execute(operation)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(this.handleError(SubscriptionError.database_operation_failed, err)));
        });
    }

    public subscribeToAuthor(from: string, to: string, amount: number, assetId: string, privateKey: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const getAssetOperation = new DatabaseOperations.GetAssets([assetId]);
            this.dbApi.execute(getAssetOperation)
                .then((assets: DCoreAssetObject) => {
                    if (assets[0] === null) {
                        reject(this.handleError(SubscriptionError.asset_does_not_exist));
                        return;
                    }
                    const price: Asset = Asset.create(amount, assets[0]);
                    const subscribeToAuthorOperation = new Operations.Subscribe(from, to, price);
                    const transaction = new Transaction();
                    transaction.add(subscribeToAuthorOperation);
                    transaction.broadcast(privateKey)
                        .then(result => {
                            resolve(result);
                        })
                        .catch(error => {
                            reject(this.handleError(SubscriptionError.transaction_broadcast_failed, error));
                        });
                })
                .catch((error) => {
                    reject(this.handleError(SubscriptionError.subscription_to_author_failed, error));
                });
        });
    }

    public subscribeByAuthor(from: string, to: string, privateKey: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.connector.connect()
                .then(res => {
                    const subscribeByAuthorOperation = new Operations.SubscribeByAuthor(from, to);
                    const transaction = new Transaction();
                    transaction.add(subscribeByAuthorOperation);
                    transaction.broadcast(privateKey)
                        .then(() => {
                            resolve(true);
                        })
                        .catch((error) => {
                            reject(this.handleError(SubscriptionError.transaction_broadcast_failed, error));
                        });
                })
                .catch(err => reject(this.handleError(SubscriptionError.blockchain_connection_failed, err)));
        });
    }

    public setAutomaticRenewalOfSubscription(
        accountId: string, subscriptionId: string, automaticRenewal: boolean, privateKey: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.connector.connect()
                .then(res => {
                    const setAutomaticRenewalOperation = new Operations.SetAutomaticRenewalOfSubscription(
                        accountId,
                        subscriptionId,
                        automaticRenewal
                    );
                    const transaction = new Transaction();
                    transaction.add(setAutomaticRenewalOperation);
                    transaction.broadcast(privateKey)
                        .then(() => {
                            resolve(true);
                        })
                        .catch(error => {
                            reject(this.handleError(SubscriptionError.transaction_broadcast_failed, error));
                        });
                })
                .catch(err => reject(this.handleError(SubscriptionError.blockchain_connection_failed, err)));
        });
    }

}
