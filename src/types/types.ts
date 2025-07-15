import { NextFunction, RequestHandler } from "express";
import {
  Request as ExRequest,
  Response as ExResponse,
} from "express-serve-static-core";

export interface NewUserRequestBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}

export interface NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}

export type ControllerType<
  ReqBody = any,
  Params = any,
  Query = any,
  ResBody = any
> = (
  req: ExRequest<Params, any, ReqBody, Query>,
  res: ExResponse<ResBody>,
  next: NextFunction
) => Promise<any>;

// export type ControllerType<
//   ReqBody = any,
//   Params = any,
//   Query = any,
//   ResBody = any
// > = RequestHandler<Params, ResBody, ReqBody, Query>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
};

export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType;
}
