
export interface ApiRequest {
  op: string;
  sid?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  seq: number;
  status: number;
  content: T;
}

export interface LoginResponse {
  session_id: string;
}

export interface ApiCategory {
  id: number;
  title: string;
  unread: number;
  labels: any[]; // Define more specific type if needed
  note: string | null;
  icon: string;
  cat_id: number;
}

export interface ApiCounterItem {
  id: number | string; // Special feeds can have string IDs like 'vfeed--1'
  counter: number;
  kind: 'feed' | 'cat' | 'label';
  auxcounter?: number;
}

export interface ApiFeed {
  id: number;
  title: string;
  unread: number;
  has_icon: boolean;
  cat_id: number;
  iconUrl?: string;
  muiIcon?: string | null;
}

export interface ApiArticle {
  id: number;
  title: string;
  updated: number;
  unread: boolean;
  marked: boolean;
  published: boolean;
  link: string;
  author: string;
  content: string;
  feed_id: number;
}
