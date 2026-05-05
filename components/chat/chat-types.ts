export interface ChatUser {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
}

export interface ChatMember {
  userId: number;
  lastReadId: number | null;
  user: ChatUser;
}

export interface ReplyPreview {
  id: number;
  text: string;
  sender: { id: number; name: string | null };
}

export interface AttachedRecord {
  id: number;
  name: string;
  order: string;
  tracing: string;
}

export interface AttachedFile {
  id: number;
  name: string;
  type: string;
  url: string;
}

export interface Message {
  id: number;
  chatId: number;
  text: string;
  createdAt: string;
  sender: ChatUser;
  replyTo: ReplyPreview | null;
  record: AttachedRecord | null;
  file: AttachedFile | null;
}

export interface Chat {
  id: number;
  name: string | null;
  isGroup: boolean;
  updatedAt: string;
  members: ChatMember[];
  lastMsg: Message | null;
  lastReadId: number | null;
}
