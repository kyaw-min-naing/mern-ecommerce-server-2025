import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  ControllerType,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility.class.js";
import { redis, redisTTL } from "../app.js";
import {
  deleteFromCloudinary,
  invalidateCache,
  uploadToCloudinary,
} from "../utils/features.js";

export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  products = await redis.get("latest-products");

  if (products) products = JSON.parse(products);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(8);
    await redis.setex("latest-products", redisTTL, JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  categories = await redis.get("categories");

  if (categories) categories = JSON.parse(categories);
  else {
    categories = await Product.distinct("category");
    await redis.setex("categories", redisTTL, JSON.stringify(categories));
  }

  return res.status(201).json({
    success: true,
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  products = await redis.get("all-products");

  if (products) products = JSON.parse(products);
  else {
    products = await Product.find({});
    await redis.setex("all-products", redisTTL, JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  const key = `product-${id}`;

  product = await redis.get(key);

  if (product) product = JSON.parse(product);
  else {
    product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 400));
    await redis.setex(key, redisTTL, JSON.stringify(product));
  }

  return res.status(201).json({
    success: true,
    product,
  });
});

export const newProduct: ControllerType<NewProductRequestBody> = TryCatch(
  async (req, res, next) => {
    const { name, category, price, stock, description } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos) return next(new ErrorHandler("Please add Photo", 400));

    if (photos.length < 1)
      return next(new ErrorHandler("Please add at least one photo", 400));

    if (photos.length > 5)
      return next(new ErrorHandler("You can add up to 5 photos", 400));

    if (!name || !category || !price || !stock || !description)
      return next(new ErrorHandler("Please enter All Fields", 400));

    const photosURL = await uploadToCloudinary(photos);

    await Product.create({
      name,
      price,
      description,
      stock,
      category: category.toLowerCase(),
      photos: photosURL,
    });

    await invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, category, price, stock, description } = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 400));

  if (photos && photos.length > 0) {
    const photosURL = await uploadToCloudinary(photos);

    const ids = product.photos.map((photo) => photo.public_id);
    await deleteFromCloudinary(ids);

    product.photos.splice(0, product.photos.length);

    for (const photo of photosURL) {
      product.photos.push(photo);
    }
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (description) product.description = description;

  await product.save();

  await invalidateCache({
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

  const ids = product.photos.map((photo) => photo.public_id);

  await deleteFromCloudinary(ids);

  await product.deleteOne();

  await invalidateCache({
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

    const key = `products- ${search}-${sort}-${category}-${price}-${page}`;

    let products;
    let totalPage;

    const cachedData = await redis.get(key);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      totalPage = data.totalPage;
      products = data.products;
    } else {
      const limit = Number(process.env.PRODUCT_PER_PAGE) || 9;
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

      const [productsFetched, filteredOnlyProduct] = await Promise.all([
        productPromise,
        Product.find(baseQuery),
      ]);

      products = productsFetched;
      totalPage = Math.ceil(filteredOnlyProduct.length / limit);

      await redis.setex(key, redisTTL, JSON.stringify({ products, totalPage }));
    }

    return res.status(201).json({
      success: true,
      products,
      totalPage,
    });
  }
);
