// ─── Connection ───────────────────────────────────────────────
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
export type ConnectionDirection = 'SENT' | 'RECEIVED';

export interface NetworkUser {
  id: number;
  full_name: string;
  avatar?: string;
  role: 'STUDENT' | 'EMPLOYER';
  headline?: string;
  company_name?: string;
  connection_id?: number;
  connection_status?: ConnectionStatus;
  direction?: ConnectionDirection;
  mutual_count?: number;
}

export interface Connection {
  connection_id: number;
  connected_at: string;
  user_id: number;
  full_name: string;
  avatar?: string;
  role: string;
  headline?: string;
  company_name?: string;
}

export interface PendingRequest {
  id: number; // connection id
  created_at: string;
  user_id: number;
  full_name: string;
  avatar?: string;
  role: string;
  headline?: string;
}

// ─── Messaging ────────────────────────────────────────────────
export interface Conversation {
  id: number;
  partner_id: number;
  partner_name: string;
  partner_avatar?: string;
  partner_role: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
