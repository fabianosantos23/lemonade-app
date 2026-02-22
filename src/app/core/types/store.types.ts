import { Ecommerce } from "../../services/ecommerces.service";
import { Status } from "./common.types";

export interface Store {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  ecommerceIds: string[];
  ecommerces: Ecommerce[];
  status: Status;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorePlatform {
  id: string;
  name: string;
  icon?: string;
}

export interface UserStoreAssignment {
  id: string;
  userId: string;
  storeId: string;
}

export interface EcommerceIntegration {
  id: string;
  storeId: string;
  ecommerce: string;
  status: `${Status}`;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}
