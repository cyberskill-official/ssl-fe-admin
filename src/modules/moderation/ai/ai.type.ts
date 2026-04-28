export enum E_SentimentType {
    MIXED = 'MIXED',
    NEGATIVE = 'NEGATIVE',
    NEUTRAL = 'NEUTRAL',
    POSITIVE = 'POSITIVE',
}

export enum E_RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum E_TextModerationDecision {
    ALLOW = 'ALLOW',
    REVIEW = 'REVIEW',
    BLOCK = 'BLOCK',
}

export enum E_ModerationCategory {
    SENTIMENT = 'SENTIMENT',
    EXPLICIT_NUDITY = 'EXPLICIT_NUDITY',
    NON_EXPLICIT_NUDITY = 'NON_EXPLICIT_NUDITY',
    SWIMWEAR_OR_UNDERWEAR = 'SWIMWEAR_OR_UNDERWEAR',
    VIOLENCE = 'VIOLENCE',
    VISUALLY_DISTURBING = 'VISUALLY_DISTURBING',
    HATE_SYMBOLS = 'HATE_SYMBOLS',
    DRUGS = 'DRUGS',
    TOBACCO = 'TOBACCO',
    ALCOHOL = 'ALCOHOL',
    GAMBLING = 'GAMBLING',
    RUDE_GESTURES = 'RUDE_GESTURES',
    EXPLICIT_CONTENT = 'EXPLICIT_CONTENT',
    HATE_SPEECH = 'HATE_SPEECH',
    PII = 'PII',
}

export enum E_ModerationMediaStatus {
    APPROVED = 'APPROVED',
    FLAGGED = 'FLAGGED',
    REJECTED = 'REJECTED',
}

export interface I_TextModerationOutput {
    category: E_ModerationCategory;
    decision?: E_SentimentType;
    score?: number;
}

export interface I_PIIEntity {
    type: string;
    score: number;
    beginOffset: number;
    endOffset: number;
}

export interface I_TextModerationResult {
    output?: I_TextModerationOutput[];
    reasons?: string[];
    decision?: E_TextModerationDecision;
    language?: string;
    piiResult?: I_PIIEntity[];
}

export interface I_TextDetection {
    detectedText: string;
}

export interface I_ContextLabel {
    name: string;
    confidence: number;
    timestampMs?: number;
}

export interface I_MediaModerationResult {
    confidence?: number;
    decision?: E_ModerationMediaStatus;
    riskLevel?: E_RiskLevel;
    reasons?: string[];
    textDetection?: I_TextDetection[];
    contextLabels?: I_ContextLabel[];
}

export interface I_AISettings {
    enabled: boolean;
    confidence: number;
    autoReject: boolean;
    categories: {
        adult: boolean;
        violence: boolean;
        hate: boolean;
        selfHarm: boolean;
        sexualContent: boolean;
        drugs: boolean;
    };
}

export interface I_ContentScan {
    id: number;
    type: 'image' | 'text' | 'video';
    content: string;
    timestamp: string;
    confidence: number;
    category: string;
    action: 'flagged' | 'approved' | 'rejected';
    aiDecision: string;
    userId?: string;
    userName?: string;
    moderationMediaId?: string;
    mediaStatus?: string;
    aiDecisionStatus?: string;
}
