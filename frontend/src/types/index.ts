 export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  status: 'online' | 'offline';
  lastSeen: string;
  isAdmin: boolean;
  createdAt?: string;
  wallpaper?: string;
  profileVisibility?: 'everyone' | 'friends';
  mediaAutoDownload?: boolean;
}

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
}

export interface Message {
  id: string;
  conversationId: string;
  sender?: UserProfile;
  senderId?: string;
  type: 'text' | 'image' | 'video' | 'file' | 'audio' | 'system';
  content: string | null;
  fileUrl: string | null;
  fileName?: string | null;
  createdAt: string;
  deleted?: boolean;
  seenBy?: string;
}

export interface FriendRequestItem {
  id: string;
  sender: UserProfile;
  createdAt: string;
}

export interface Invitation {
  id: string;
  token: string;
  label: string | null;
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  active: boolean;
  inviteLink: string;
  createdAt: string;
}

export interface JoinRequestItem {
  id: string;
  fullName: string;
  email: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  paymentRequired: boolean;
  paymentStatus: 'none' | 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface StatusItem {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string | null;
  fileUrl: string | null;
  backgroundColor: string | null;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
}

export interface StatusGroup {
  user: UserProfile;
  statuses: StatusItem[];
  hasUnseen: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: UserProfile;
}

export interface PostItem {
  id: string;
  author: UserProfile;
  content: string | null;
  fileUrl: string | null;
  type: 'text' | 'image' | 'video';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  isMine: boolean;
}

export interface ProfileGroup {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  createdByThisUser: boolean;
  viewerIsMember: boolean;
}

export interface FullProfile {
  user: UserProfile;
  relationship: 'self' | 'friends' | 'pending_sent' | 'pending_received' | 'none';
  friendCount: number;
  groups: ProfileGroup[];
  canViewPosts: boolean;
  posts: PostItem[];
}
