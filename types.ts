
export interface TranslationResult {
  originalText?: string;
  translatedText: string;
  detectedLanguage: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}

export type TargetLanguage = 'Português' | 'Inglês' | 'Espanhol';

export type OCRMode = 'rápido' | 'alta-precisão';
