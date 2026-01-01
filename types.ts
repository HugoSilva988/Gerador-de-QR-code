
export enum QRMode {
  TEXT = 'text',
  URL = 'url',
  WIFI = 'wifi',
  EMAIL = 'email',
  VCARD = 'vcard',
  SOCIAL = 'social'
}

export interface QRSettings {
  content: string;
  fgColor: string;
  bgColor: string;
  size: number;
  includeMargin: boolean;
  level: 'L' | 'M' | 'Q' | 'H';
}

export interface AIRequest {
  prompt: string;
  type: 'creative' | 'wifi' | 'business' | 'social';
}

export interface GeneratedContentResponse {
  text: string;
}
