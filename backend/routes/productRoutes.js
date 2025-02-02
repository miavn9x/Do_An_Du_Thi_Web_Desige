const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/productModel");
const router = express.Router();

// Cấu hình Multer để lưu trữ tạm thời các tệp trong bộ nhớ
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Kiểm tra trùng lặp sản phẩm
const checkDuplicate = async (name, brand, category) => {
  try {
    const existingProduct = await Product.findOne({ name, brand, category });
    return existingProduct; // Nếu có sản phẩm trùng, sẽ trả về sản phẩm đó
  } catch (err) {
    throw new Error("Lỗi kiểm tra trùng lặp");
  }
};

// Thêm sản phẩm mới với hình ảnh lên Cloudinary
router.post("/products", upload.array("images", 20), async (req, res) => {
  const {
    name,
    categoryName, // Adjusted to match schema
    categoryGeneric, // Adjusted to match schema
    brand,
    description,
    originalPrice,
    discountPercentage,
    priceAfterDiscount,
    discountCode,
    stock,
  } = req.body;

  try {
    // Kiểm tra trùng lặp sản phẩm
    const duplicateProduct = await checkDuplicate(name, brand, categoryName);
    if (duplicateProduct) {
      return res.status(400).json({ message: "Sản phẩm này đã tồn tại." });
    }

    // Upload tất cả các hình ảnh lên Cloudinary
    const imageUploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "products" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file.buffer);
      });
    });

    const uploadResults = await Promise.all(imageUploadPromises);
    const images = uploadResults.map((result) => result.secure_url);

    // Tạo mới sản phẩm và lưu vào database
    const newProduct = new Product({
      name,
      category: {
        name: categoryName,
        generic: categoryGeneric,
      },
      brand,
      description,
      originalPrice,
      discountPercentage,
      priceAfterDiscount,
      discountCode,
      images,
      stock, // Số lượng trong kho
      remainingStock: stock, // Số lượng còn lại ban đầu bằng số lượng trong kho
    });

    await newProduct.save();

    // Trả về thông báo thành công
    res.status(201).json({
      message: "Sản phẩm đã được thêm thành công",
      product: newProduct,
    });
  } catch (err) {
    console.error("Lỗi khi upload hình ảnh hoặc lưu sản phẩm:", err);
    res.status(500).json({ message: "Có lỗi xảy ra khi thêm sản phẩm" });
  }
});

// API route: GET /products
router.get("/products", async (req, res) => {
  try {
    const {
      page = 1, // Mặc định là trang đầu tiên
      limit = 9900, // Giới hạn sản phẩm tối đa
      search = "", // Từ khóa tìm kiếm
      categoryName, // Tên danh mục
      categoryGeneric, // Danh mục chung
      minPrice, // Giá tối thiểu
      maxPrice, // Giá tối đa
      sortBy = "default", // Sắp xếp
    } = req.query;

    // Kiểm tra `page` và `limit` là số nguyên dương
    const validPage = Math.max(1, parseInt(page, 10));
    const validLimit = Math.max(1, parseInt(limit, 10));

    // Xây dựng query lọc
    const query = {
      ...(search && {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }),
      ...(categoryName && {
        "category.name": { $regex: categoryName, $options: "i" },
      }),
      ...(categoryGeneric && {
        "category.generic": { $regex: categoryGeneric, $options: "i" },
      }),
      ...(minPrice &&
        !isNaN(minPrice) && {
          priceAfterDiscount: { $gte: Number(minPrice) },
        }),
      ...(maxPrice &&
        !isNaN(maxPrice) && {
          priceAfterDiscount: { $lte: Number(maxPrice) },
        }),
    };

    // Xử lý random riêng
    if (sortBy === "random") {
      const randomProducts = await Product.aggregate([
        { $match: query },
        { $sample: { size: validLimit } }, // Random số lượng sản phẩm
      ]);
      return res.status(200).json({
        products: randomProducts,
        totalPages: 1, // Random không phân trang
        currentPage: 1,
      });
    }

    // Cấu hình sắp xếp
    const sortQuery =
      sortBy === "priceAsc"
        ? { priceAfterDiscount: 1 } // Giá tăng dần
        : sortBy === "priceDesc"
        ? { priceAfterDiscount: -1 } // Giá giảm dần
        : sortBy === "discountPercentage"
        ? { discountPercentage: -1 } // Phần trăm giảm giá
        : {}; // Mặc định không sắp xếp

    // Fetch sản phẩm với query và sắp xếp
    const products = await Product.find(query)
      .limit(validLimit)
      .skip((validPage - 1) * validLimit)
      .sort(sortQuery);

    // Đếm tổng số sản phẩm
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(totalProducts / validLimit),
      currentPage: validPage,
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm." });
  }
});

// Route lấy chi tiết sản phẩm theo ID
router.get("/products/:id", async (req, res) => {
  const productId = req.params.id;

  // Validate product ID
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ message: "Có lỗi xảy ra khi lấy thông tin sản phẩm." });
  }
});


// Route sửa sản phẩm (PUT)
router.put("/products/:id", upload.array("images", 20), async (req, res) => {
  const productId = req.params.id;

  // Validate product ID
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
  }

  try {
    // Fetch existing product data
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    // Extract category data from request body
    const categoryName = req.body['category[name]'] || req.body.category?.name;
    const categoryGeneric = req.body['category[generic]'] || req.body.category?.generic;

    // Construct updated product data
    const updatedProductData = {
      name: req.body.name || existingProduct.name,
      brand: req.body.brand || existingProduct.brand,
      description: req.body.description || existingProduct.description,
      originalPrice: req.body.originalPrice || existingProduct.originalPrice,
      discountPercentage: req.body.discountPercentage || existingProduct.discountPercentage,
      priceAfterDiscount: req.body.priceAfterDiscount || existingProduct.priceAfterDiscount,
      discountCode: req.body.discountCode || existingProduct.discountCode,
      remainingStock: req.body.remainingStock || existingProduct.remainingStock,
      stock: req.body.stock || existingProduct.stock,
      category: {
        name: categoryName || existingProduct.category.name,
        generic: categoryGeneric || existingProduct.category.generic
      }
    };

    // Handle image upload
    if (req.files && req.files.length > 0) {
      try {
        // Delete old images from Cloudinary
        const deleteImagePromises = existingProduct.images.map((url) => {
          const publicId = url.split("/").pop().split(".")[0];
          return cloudinary.uploader.destroy(`products/${publicId}`);
        });
        await Promise.all(deleteImagePromises);

        // Upload new images to Cloudinary
        const imageUploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "products" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(file.buffer);
          });
        });

        const uploadResults = await Promise.all(imageUploadPromises);
        updatedProductData.images = uploadResults.map(
          (result) => result.secure_url
        );
      } catch (error) {
        console.error("Error handling images:", error);
        return res.status(500).json({ message: "Lỗi khi xử lý hình ảnh." });
      }
    }

    // Update the product with new data
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedProductData,
      { new: true }
    );

    // Log successful update
    // console.log("Updated product:", updatedProduct);

    res.status(200).json({
      message: "Sản phẩm đã được cập nhật thành công.",
      product: updatedProduct,
    });
  } catch (error) {
    // console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({ 
      message: "Có lỗi xảy ra khi cập nhật sản phẩm.",
      error: error.message 
    });
  }
});
// Route xóa sản phẩm
router.delete("/products/:id", async (req, res) => {
  const productId = req.params.id;

  // Kiểm tra nếu ID không hợp lệ
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res
      .status(200)
      .json({ message: "Sản phẩm đã được xóa.", product: deletedProduct });
  } catch (err) {
    console.error("Lỗi khi xóa sản phẩm:", err);
    res.status(500).json({ message: "Có lỗi xảy ra khi xóa sản phẩm." });
  }
});

// Route cập nhật số lượng còn lại khi mua hàng (POST)
router.post("/products/:id/purchase", async (req, res) => {
  const productId = req.params.id;
  const { quantity } = req.body;

  try {
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Số lượng mua không hợp lệ." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    if (product.remainingStock < quantity) {
      return res.status(400).json({ message: "Số lượng trong kho không đủ." });
    }

    // Giảm số lượng còn lại sau khi mua
    product.remainingStock -= quantity;

    await product.save();

    res.status(200).json({
      message: "Mua hàng thành công",
      product,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật số lượng sản phẩm:", err);
    res.status(500).json({ message: "Có lỗi xảy ra khi mua hàng." });
  }
});

module.exports = router;
