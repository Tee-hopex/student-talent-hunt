export type Role = "ADMIN" | "JUDGE" | "STUDENT";
export type StudentClass = "JSS3" | "SS3";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PostType = "NEWS" | "ANNOUNCEMENT" | "DEADLINE_REMINDER";

export interface Category {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  maxScore: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  status: EventStatus;
  registrationOpensAt: string;
  registrationClosesAt: string;
  competitionStartsAt: string;
  competitionEndsAt: string;
  resultsPublishedAt?: string | null;
  votingOpensAt?: string | null;
  firstPrize?: string | null;
  secondPrize?: string | null;
  thirdPrize?: string | null;
  categories: Category[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Student {
  id: string;
  fullName: string;
  school: string;
  studentClass: StudentClass;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string | null;
  address?: string | null;
}

export interface Score {
  id: string;
  applicationId: string;
  judgeId: string;
  score: number;
  comment?: string | null;
  judge?: { user: { name: string } };
}

export interface Application {
  id: string;
  studentId: string;
  eventId: string;
  categoryId: string;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  category?: Category;
  event?: Event;
  student?: { fullName: string; school: string; studentClass: StudentClass };
  scores?: Score[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  type: PostType;
  isPublished: boolean;
  publishedAt?: string | null;
  author?: { name: string };
}

export interface StudentProfile {
  id: string;
  fullName: string;
  school: string;
  studentClass: StudentClass;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string | null;
  address?: string | null;
  user: { email: string; name: string; phone?: string | null };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title?: string | null;
  mediaType: "PHOTO" | "VIDEO";
  url: string;
  thumbnailUrl?: string | null;
  isFeatured: boolean;
}

export interface Judge {
  id: string;
  bio?: string | null;
  user: { id: string; name: string; email: string; isActive: boolean };
  categories: { category: Category }[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  action: "VIEW_ID" | "DOWNLOAD_ID" | "VIEW_CONSENT" | "DOWNLOAD_CONSENT";
  ipAddress: string;
  createdAt: string;
  actor: { name: string; email: string };
}

export interface ReportOverview {
  totals: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
  };
  byCategory: { categoryId: string; categoryName: string; count: number }[];
}

export interface ResultRanking {
  applicationId: string;
  studentName: string;
  school: string;
  photoUrl?: string | null;
  avgScore: number;
  judgeCount: number;
  voteCount: number;
}

export interface CategoryResults {
  categoryId: string;
  categoryName: string;
  ranking: ResultRanking[];
}

export interface PublishedResults {
  published: boolean;
  categories: CategoryResults[];
}

export interface VoteLeaderboardEntry {
  applicationId: string;
  studentName: string;
  school: string;
  photoUrl?: string | null;
  voteCount: number;
}
