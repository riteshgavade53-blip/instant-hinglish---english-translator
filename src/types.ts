export interface TranslationResult {
  casual: string;
  professional: string;
}

export type TranslationTone = 'casual' | 'professional';

export interface ExtensionMessage {
  type: 'TRANSLATE_TEXT';
  text: string;
}

export interface ExtensionResponse {
  success: boolean;
  data?: TranslationResult;
  error?: string;
}
