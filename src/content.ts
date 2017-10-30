import {DatabaseApi, DatabaseOperation} from './api/database';
import {ChainApi, ChainMethods} from './api/chain';
import {ContentCancelOperation, TransactionOperationName, TransactionOperator} from './transactionOperator';

export interface Content {
    id: string
    author: string
    price: Price
    synopsis: Synopsis
    status: Status
    URI: IpfsUrl
    _hash: string
    AVG_rating: number
    size: number
    expiration: string
    created: string
    times_bought: number
}

export interface Synopsis {
    title: string
    description: string
    content_type_id: string
    file_name: string
    language: string
    sampleURL: string
    fileFormat: string
    length: string
    content_licence: string
}

export interface Price {
    amount: number
    asset_id: string
}

export class Status {
    static Uploaded = 'Uploaded';
    static Partially_uploaded = 'Partially uploaded';
    static Uploading = 'Uploading';
    static Expired = 'Expired';
}

export class IpfsUrl {
    private _filename: string;
    get filename(): string {
        return this._filename;
    }

    constructor(filename: string) {
        this._filename = filename;
    }

    public getURI(): string {
        return `ipfs:${this._filename}`;
    }
}

export class SearchParams {
    term = '';
    order = '';
    user = '';
    region_code = '';
    itemId = '';
    category: number;
    count: number;

    constructor(term = '',
                order = '',
                user = '',
                region_code = '',
                itemId = '',
                category: number = 1,
                count: number = 6) {
        this.term = term || '';
        this.order = order || '';
        this.user = user || '';
        this.region_code = region_code || '';
        this.itemId = itemId || '';
        this.category = category || 1;
        this.count = count || 6;
    }

    get params(): any[] {
        let params: any[] = [];
        params = Object.values(this).reduce((previousValue, currentValue) => {
            previousValue.push(currentValue);
            return previousValue;
        }, params);
        return params;
    }
}

export class ContentApi {
    private _dbApi: DatabaseApi;

    constructor(dbApi: DatabaseApi) {
        this._dbApi = dbApi;
    }

    public searchContent(searchParams: SearchParams): Promise<Content[]> {
        return new Promise((resolve, reject) => {
            this._dbApi
                .execute(DatabaseOperation.searchContent, searchParams.params)
                .then((content: any) => {
                    resolve(content);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    }

    public getContent(id: string): Promise<Content> {
        return new Promise((resolve, reject) => {
            const chainOps = new ChainMethods();
            chainOps.add(ChainMethods.getObject, id);
            ChainApi.fetch(chainOps)
                .then((content: any) => {
                    resolve(content);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    /**
     * Cancel submitted content record from blockchain.
     *
     * @param {string} id example: '1.2.435'
     * @param {string} authorId example: '1.2.532'
     * @return {Promise<any>}
     */
    public removeContent(id: string, authorId: string, privateKey: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const methods = new ChainMethods();
            methods.add(ChainMethods.getAccount, authorId);

            ChainApi.fetch(methods)
                .then(result => {
                    const [account] = result;
                    const publicKey = account.get('owner').get('key_auths').get(0).get(0);
                    const transaction = TransactionOperator.createTransaction();
                    const cancellation: ContentCancelOperation = {
                        author: authorId,
                        URI: id
                    };
                    TransactionOperator.addOperation({
                        name: TransactionOperationName.content_cancellation,
                        operation: cancellation
                    }, transaction);
                    TransactionOperator.broadcastTransaction(transaction, privateKey, publicKey)
                        .then(() => {
                           resolve();
                        })
                        .catch(() => {
                            reject();
                        });
                });
        });
    }
}
