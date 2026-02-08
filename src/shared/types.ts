// ============================================================================
// API RESPONSE MODELS
// ============================================================================

export interface VideoAnalysisResponse {
  videoId: string;
  status: 'cached' | 'analyzing' | 'error';
  data?: VideoAnalysisData;
  message?: string;
}

export interface VideoAnalysisData {
  videoId: string;
  channelId: string;
  
  loyalSentiment: number | null;
  casualSentiment: number | null;
  overallSentiment: number;
  
  loyalCount: number;
  casualCount: number;
  totalComments: number;
  
  analyzedAt: string;
  cacheExpiresAt: string;
}

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export interface Comment {
  text: string;
  userId: string;
  username: string;
  timestamp: string;
  commentId: string;
}

export interface CommentWithClassification extends Comment {
  classification: 'loyal' | 'casual';
}

export interface UserStats {
  userId: string;
  channelId: string;
  totalComments: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ChannelMetadata {
  channelId: string;
  bootstrapped: boolean;
  videosAnalyzed: number;
  firstAnalyzedDate: string;
}

// ============================================================================
// SQS MESSAGE PAYLOADS
// ============================================================================

export interface CommentFetchMessage {
  videoId: string;
  channelId: string;
  needsBootstrap: boolean;
  requestedAt: string;
}

export interface LoyaltyAnalysisMessage {
  videoId: string;
  channelId: string;
  comments: Comment[];
  fetchedAt: string;
}

export interface SentimentAnalysisPayload {
  videoId: string;
  channelId: string;
  loyalComments: CommentWithClassification[];
  casualComments: CommentWithClassification[];
}

// ============================================================================
// DYNAMODB ITEM TYPES
// ============================================================================

export interface VideoAnalysisDDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  
  videoId: string;
  channelId: string;
  loyalSentiment: number | null;
  casualSentiment: number | null;
  overallSentiment: number;
  loyalCount: number;
  casualCount: number;
  totalComments: number;
  analyzedAt: string;
  ttl?: number;
}

export interface VideoMetadataDDBItem {
  PK: string;
  SK: string;
  
  videoId: string;
  channelId: string;
  lastAnalyzed: string;
  title?: string;
}

export interface UserStatsDDBItem {
  PK: string;
  SK: string;
  
  userId: string;
  channelId: string;
  totalComments: number;
  firstSeen: string;
  lastSeen: string;
}

export interface UserCommentDDBItem {
  PK: string;
  SK: string;
  
  userId: string;
  channelId: string;
  videoId: string;
  commentId: string;
  commentDate: string;
}

export interface ChannelMetadataDDBItem {
  PK: string;
  SK: string;
  
  channelId: string;
  bootstrapped: boolean;
  videosAnalyzed: number;
  firstAnalyzedDate: string;
}

// ============================================================================
// EXTERNAL API TYPES
// ============================================================================

export interface YouTubeComment {
  id: string;
  snippet: {
    authorChannelId: { value: string };
    authorDisplayName: string;
    textDisplay: string;
    publishedAt: string;
  };
}

export interface YouTubeCommentThreadResponse {
  items: Array<{
    snippet: {
      topLevelComment: YouTubeComment;
    };
  }>;
  nextPageToken?: string;
}

export interface ComprehendSentimentResult {
  Sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  SentimentScore: {
    Positive: number;
    Negative: number;
    Neutral: number;
    Mixed: number;
  };
}

export interface ComprehendBatchResult {
  ResultList: Array<{
    Index: number;
    Sentiment: string;
    SentimentScore: {
      Positive: number;
      Negative: number;
      Neutral: number;
      Mixed: number;
    };
  }>;
  ErrorList: Array<{
    Index: number;
    ErrorCode: string;
    ErrorMessage: string;
  }>;
}

// ============================================================================
// LAMBDA EVENT TYPES
// ============================================================================

export interface APIGatewayProxyEventWithParams {
  pathParameters: {
    videoId: string;
  };
  headers: Record<string, string>;
  requestContext: {
    requestId: string;
  };
}