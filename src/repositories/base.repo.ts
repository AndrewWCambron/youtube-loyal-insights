import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../shared/config';

export class BaseRepository {
  protected readonly client: DynamoDBDocumentClient;
  protected readonly tableName: string;

  constructor() {
    const ddbClient = new DynamoDBClient({
      region: config.aws.region,
      ...(config.isLocal && {
        endpoint: 'http://localhost:8000',
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }),
    });

    this.client = DynamoDBDocumentClient.from(ddbClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });

    this.tableName = config.aws.tableName;
  }

  protected async get<T>(PK: string, SK: string): Promise<T | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK, SK },
      })
    );

    return (result.Item as T) || null;
  }

  protected async put<T extends Record<string, any>>(item: T): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
  }

  protected async query<T>(
    PK: string,
    options?: {
      SK?: string;
      SKBeginsWith?: string;
      limit?: number;
      ascending?: boolean;
    }
  ): Promise<T[]> {
    let KeyConditionExpression = 'PK = :pk';
    const ExpressionAttributeValues: Record<string, any> = { ':pk': PK };

    if (options?.SK) {
      KeyConditionExpression += ' AND SK = :sk';
      ExpressionAttributeValues[':sk'] = options.SK;
    } else if (options?.SKBeginsWith) {
      KeyConditionExpression += ' AND begins_with(SK, :sk)';
      ExpressionAttributeValues[':sk'] = options.SKBeginsWith;
    }

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression,
        ExpressionAttributeValues,
        Limit: options?.limit,
        ScanIndexForward: options?.ascending ?? true,
      })
    );

    return (result.Items as T[]) || [];
  }

  protected async batchGet<T>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    if (keys.length === 0) return [];

    // DynamoDB BatchGetItem limit is 100
    const batches: Array<{ PK: string; SK: string }[]> = [];
    for (let i = 0; i < keys.length; i += 100) {
      batches.push(keys.slice(i, i + 100));
    }

    const results: T[] = [];

    for (const batch of batches) {
      const result = await this.client.send(
        new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: batch,
            },
          },
        })
      );

      if (result.Responses?.[this.tableName]) {
        results.push(...(result.Responses[this.tableName] as T[]));
      }
    }

    return results;
  }

  protected async batchWrite(items: Array<Record<string, any>>): Promise<void> {
    if (items.length === 0) return;

    // DynamoDB BatchWriteItem limit is 25
    const batches: Array<Record<string, any>[]> = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    for (const batch of batches) {
      await this.client.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        })
      );
    }
  }

  protected async update(
    PK: string,
    SK: string,
    updates: Record<string, any>
  ): Promise<void> {
    const UpdateExpression = 'SET ' + Object.keys(updates).map((k, i) => `#${k} = :${k}`).join(', ');
    const ExpressionAttributeNames = Object.keys(updates).reduce(
      (acc, k) => ({ ...acc, [`#${k}`]: k }),
      {}
    );
    const ExpressionAttributeValues = Object.entries(updates).reduce(
      (acc, [k, v]) => ({ ...acc, [`:${k}`]: v }),
      {}
    );

    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { PK, SK },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      })
    );
  }
}