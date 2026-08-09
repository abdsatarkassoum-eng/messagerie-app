export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name: string;
  avatarUrl: string | null;
  members: UserProfile[];
  memberRoles: Record<string, 'admin' | 'member'>;
  lastMessage: {
    content: string | null;
    type: string;
    senderId: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
  lastMessageSeenByOther: boolean | null;
}
