import { LucideIconData } from "lucide-angular";

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  ENHANCED = 'ENHANCED',
  PUBLISHED = 'PUBLISHED'
}

export enum ImprovedDescriptionStatus {
  GENERATED = 'GENERATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ImprovedDescription {
  id: string;
  productId: string;
  ecommerceId: string;
  result: string;
  regenerationCount: number;
  status: ImprovedDescriptionStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  characters: number;
  words: number;
  lines: number;
}

export interface Product {
  id: string;
  name: string;
  simpleDescription: string;
  storeId: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  updatedById: string | null;
  status: ProductStatus;
  generatedDescriptions?: ImprovedDescription[];
}

export interface CreateProductDto {
  name: string;
  simpleDescription: string;
  storeId: string;
}

export interface UpdateProductDto {
  name?: string;
  simpleDescription?: string;
}

export interface GenerateDescriptionBatchDto {
  ecommerceIds: string[];
  simpleDescription: string;
}

export type GenerateBatchResponse = {
  id: string;
  productId: string;
  ecommerceId: string;
  result: string;
  regenerationCount: number;
  status: ImprovedDescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegenerateDescriptionDto {
  ecommerceId: string;
}

export interface ProductStats {
  total: number;
  basic: number;
  enhanced: number;
  published: number;
}

export interface GeneratedDescription {
  id: string;
  name: string;
  icon: string;
  result: string;
  generatedAt: string | Date;
  status: ImprovedDescriptionStatus;
}

export type GeneratedDescriptionApi = GenerateBatchResponse;

export enum ProductHistoryType {
  CREATE = "CREATE",
  EDIT = "EDIT",
  ENHANCED_DESCRIPTION = "ENHANCED_DESCRIPTION",
  STATUS_CHANGE = "STATUS_CHANGE",
  DELETE = "DELETE",
  ARCHIVE = "ARCHIVE",
}

export interface ProductHistoryItem {
  id: string;
  productId: string;
  type: ProductHistoryType;
  createdAt: string | Date;
  title: string;
  message: string;
  formattedMessage: string;
  createdById: string;
  createdByName: string;
  alterationData: unknown;
}

export interface ProductQuickStats {
  status: ProductStatus;
  generatedDescriptionsCount: number;
  ecommercesWithDescription: number;
  lastEnhancementAt: string | null;
}

export type PaginatedProducts = {
  limit: number
  message: string
  page: number
  statusCode: number
  timestamp: string
  total: number
  totalPages: number
  data: Product[]
}

export interface ProductHistoryTimelineItem {
  id: string;
  type: ProductHistoryType;
  createdAt: string | Date;
  title: string;
  message: string;
  formattedMessage: string;
  createdByName: string;
  alterationData?: unknown;
  color: string;
  icon: LucideIconData;
  iconSize: number;
  iconColor: string;
}
