// ===== Tenant =====
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  brandTokens: Record<string, string>;
  featureFlags: Record<string, boolean>;
  reviewRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== User & Auth =====
export type Role = 'admin' | 'editor_in_chief' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  taipeiPassId: string | null;
  isSuperAdmin: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: Role;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  role: Role;
  is_super_admin: boolean;
  exp: number;
}

// ===== Content =====
export type PageType = 'news' | 'service' | 'about' | 'custom';
export type PageStatus = 'draft' | 'pending' | 'approved' | 'published' | 'archived';

export interface Page {
  id: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  locale: string;
  authorId: string;
  reviewerId: string | null;
  publishAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  title: string;
  bodyJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageKey: string | null;
  changeSummary: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
}

export interface Media {
  id: string;
  filename: string;
  storageKey: string;
  cdnUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export interface NavigationItem {
  id: string;
  parentId: string | null;
  label: string;
  url: string | null;
  pageId: string | null;
  sortOrder: number;
  openNewTab: boolean;
  isVisible: boolean;
}

// ===== API Response =====
export interface ApiResponse<T> {
  data: T;
  meta?: {
    tenant?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ===== Audit =====
export type AuditAction = 'create' | 'update' | 'publish' | 'delete' | 'login';
export type ResourceType = 'page' | 'media' | 'tenant_config' | 'user';
