export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    tableName: process.env.TABLE_NAME!,
    commentFetchQueueUrl: process.env.COMMENT_FETCH_QUEUE_URL!,
    loyaltyAnalysisQueueUrl: process.env.LOYALTY_ANALYSIS_QUEUE_URL!,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY!,
    maxComments: 200,
  },
  sentiment: {
    loyalThreshold: 5,
    cacheDurationHours: 24,
    comprehendBatchSize: 25,
  },
  api: {
    corsOrigins: ['chrome-extension://*', 'https://www.youtube.com'],
  },
  isDevelopment: process.env.NODE_ENV !== 'production',
  isLocal: process.env.IS_LOCAL === 'true',
};

export function validateConfig(): void {
  const required = ['TABLE_NAME'];
  
  if (!config.isLocal) {
    required.push('COMMENT_FETCH_QUEUE_URL', 'LOYALTY_ANALYSIS_QUEUE_URL', 'YOUTUBE_API_KEY');
  }
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}