import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  ControllerType,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility.class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
// import { faker } from "@faker-js/faker";

export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products"))
    products = JSON.parse(myCache.get("latest-products") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(201).json({
    success: true,
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string);
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;

  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 400));
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(201).json({
    success: true,
    product,
  });
});

export const newProduct: ControllerType<NewProductRequestBody> = TryCatch(
  async (req, res, next) => {
    const { name, category, price, stock } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add Photo", 400));

    if (!name || !category || !price || !stock) {
      rm(photo.path, () => {
        console.log("Deleted");
      });

      return next(new ErrorHandler("Please enter All Fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, category, price, stock } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 400));

  if (photo) {
    rm(product.photo, () => {
      console.log("Old Photo Deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (price) product.price = price;
  if (stock) product.stock = stock;

  await product.save();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 400));

  rm(product.photo, () => {
    console.log("Product Photo Deleted");
  });

  await product.deleteOne();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(201).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getAllProducts: ControllerType<SearchRequestQuery> = TryCatch(
  async (req, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };
    if (category) baseQuery.category = category;

    const productPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProduct] = await Promise.all([
      productPromise,
      Product.find(baseQuery),
    ]);
    const totoalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(201).json({
      success: true,
      products,
      totoalPage,
    });
  }
);

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\05f46926-4f1f-4416-a85e-6f50a2b3c327.jpg",
//       price: faker.commerce.price({ min: 5000, max: 500000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       _v: 0,
//     };

//     products.push(product);
//   }
//   await Product.create(products);
//   console.log({ success: true });
// };

// const deleteRandomProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ success: true });
// };
