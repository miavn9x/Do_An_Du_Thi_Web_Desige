import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../../../styles/ProductEdit.css"; // Đảm bảo file CSS tồn tại để định dạng giao diện
import { ButtonBase } from "@mui/material";

const ProductEdit = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedType, setSelectedType] = useState("");

  // --- Phần thương hiệu trong edit ---
  // Danh sách thương hiệu theo nhóm (theo danh mục)
  const predefinedBrandsByCategory = {
    Sữa: [
      "Vinamilk",
      "Dielac",
      "Nutifood",
      "TH True Milk",
      "Mami",
      "Friso",
      "Meiji",
      "Aptamil",
      "Similac",
      "Enfamil",
      "Nestlé",
    ],
    "Bỉm & Tã": ["Pampers", "Huggies", "MamyPoko", "Bambo Nature"],
    "Chăm sóc & Dinh dưỡng": [
      "Pigeon",
      "Mee Mee",
      "Johnson's Baby",
      "Abbott",
      "Mead Johnson",
      "Hersheys",
    ],
    "Thời trang & Đồ dùng": [
      "Mothercare",
      "Carter's",
      "OshKosh B'gosh",
      "Zara Kids",
      "Mother & Baby",
    ],
    "Nổi Bật": [
      "Fisher-Price",
      "Chicco",
      "Blackmores",
      "aribaly",
      "hikid",
      "meadjohnson",
      "blackmores",
      "arifood",
      "aptamil",
      "cosmic light",
    ],
  };

  // State lưu lựa chọn từ dropdown cho thương hiệu trong form edit
  const [editSelectedBrand, setEditSelectedBrand] = useState("");

  const categoryOptions = {
    "Sữa bột cao cấp": [
      "Sữa bột cho bé 0-6 tháng",
      "Sữa bột cho bé 6-12 tháng",
      "Sữa bột cho bé 1-3 tuổi",
      "Sữa bột cho bé 3-5 tuổi",
      "Sữa bột organic",
      "Sữa non tăng đề kháng",
    ],
    "Sữa dinh dưỡng": [
      "Sữa cho mẹ bầu",
      "Sữa tăng canxi cho bà bầu",
      "Sữa cho mẹ sau sinh",
      "Sữa cho bé từ 1 tuổi",
      "Sữa tăng chiều cao cho bé 3-5 tuổi",
    ],
    "Bỉm & Tã em bé": [
      "Bỉm sơ sinh (< 5kg)",
      "Bỉm size S (4-8kg)",
      "Bỉm size M (6-11kg)",
      "Bỉm size L (9-14kg)",
      "Bỉm size XL (12-17kg)",
      "Bỉm quần cho bé tập đi",
    ],
    "Đồ chơi em bé": [
      "Đồ chơi bé gái",
      "Đồ chơi bé trai",
      "Sách, học tập",
      "Đồ chơi sơ sinh",
      "Scooter, vận động",
    ],
    "Chăm sóc gia đình": [
      "Chăm sóc da bầu (chống rạn)",
      "Dầu massage bầu",
      "Kem dưỡng da cho bé",
      "Dầu tắm gội cho bé",
      "Phấn rôm chống hăm",
      "Nhiệt kế & Máy hút mũi",
    ],
    "Thời trang mẹ và bé": [
      "Đồ bầu theo tháng (1-8 tháng)",
      "Váy bầu công sở",
      "Đồ sau sinh",
      "Quần áo sơ sinh (0-12 tháng)",
      "Quần áo bé 1-3 tuổi",
      "Quần áo bé 3-5 tuổi",
    ],
    "Dinh dưỡng bà bầu": [
      "Vitamin tổng hợp cho bà bầu",
      "Sắt và axit folic",
      "Canxi và Vitamin D3",
      "Omega 3 và DHA",
      "Sữa bầu công thức đặc biệt",
    ],
    "Ăn dặm cho bé": [
      "Bột ăn dặm 6-8 tháng",
      "Bột ăn dặm 8-12 tháng",
      "Cháo ăn dặm 12-24 tháng",
      "Bánh ăn dặm",
      "Vitamin & Khoáng chất ăn dặm",
      "Dụng cụ ăn dặm",
    ],
    "Dinh dưỡng cho bé": [
      "Vitamin tổng hợp cho bé 0-12 tháng",
      "Vitamin cho bé 1-3 tuổi",
      "Vitamin cho bé 3-5 tuổi",
      "Men vi sinh cho bé",
      "Kẽm & Sắt cho bé",
      "DHA cho bé",
    ],
    "Đồ dùng thiết yếu": [
      "Máy hút sữa & Phụ kiện",
      "Bình sữa & Núm ti",
      "Máy tiệt trùng & Hâm sữa",
      "Nôi & Cũi cho bé",
      "Xe đẩy & Địu",
      "Ghế ăn & Ghế rung",
    ],
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/products", {
        params: {
          page: currentPage,
          search,
          categoryName: categoryFilter,
          categoryGeneric: selectedType,
          limit: 10,
        },
      });

      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Error fetching products.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, categoryFilter, selectedType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    setLoading(true);
    try {
      await axios.delete(`/api/products/${productId}`);
      fetchProducts();
    } catch (error) {
      setErrorMessage("Lỗi khi xóa sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditFormData({
      ...product,
      category: {
        name: product.category.name || "",
        generic: product.category.generic || "",
      },
    });
    setSelectedImages([]);
    // Thiết lập giá trị cho dropdown thương hiệu trong form edit:
    setEditSelectedBrand(
      product.brand &&
        Object.values(predefinedBrandsByCategory).flat().includes(product.brand)
        ? product.brand
        : product.brand
        ? "other"
        : ""
    );
    setErrorMessage(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((prev) => {
      const newFormData = { ...prev };

      if (name === "category.name") {
        newFormData.category = {
          ...newFormData.category,
          name: value,
          generic: "",
        };
      } else if (name === "category.generic") {
        newFormData.category = {
          ...newFormData.category,
          generic: value,
        };
      } else if (name === "stock") {
        const newStock = parseInt(value) || 0;
        const oldStock = parseInt(prev.stock) || 0;
        const oldRemainingStock = parseInt(prev.remainingStock) || 0;
        const difference = newStock - oldStock;
        newFormData.stock = newStock;
        newFormData.remainingStock = Math.max(
          0,
          oldRemainingStock + difference
        );
      } else if (name === "remainingStock") {
        const maxStock = parseInt(newFormData.stock) || 0;
        newFormData.remainingStock = Math.min(parseInt(value) || 0, maxStock);
      } else {
        newFormData[name] = value;
      }

      if (name === "originalPrice" || name === "discountPercentage") {
        const price = parseFloat(newFormData.originalPrice);
        const discount = parseFloat(newFormData.discountPercentage);
        if (!isNaN(price) && !isNaN(discount)) {
          newFormData.priceAfterDiscount = (
            price *
            (1 - discount / 100)
          ).toFixed();
        }
      }

      return newFormData;
    });
  };

  const handleImageChange = (e) => {
    setSelectedImages(e.target.files);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Thêm các trường cơ bản
      Object.keys(editFormData).forEach((key) => {
        if (
          key !== "images" &&
          key !== "_id" &&
          key !== "__v" &&
          key !== "category"
        ) {
          formData.append(key, editFormData[key]);
        }
      });

      // Thêm category như một object
      formData.append("category[name]", editFormData.category.name);
      formData.append("category[generic]", editFormData.category.generic);

      // Thêm hình ảnh nếu có
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          formData.append("images", selectedImages[i]);
        }
      }

      await axios.put(`/api/products/${editingProduct._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      setErrorMessage("Lỗi khi cập nhật sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setCategoryFilter(value);
      setSelectedType(""); // Reset product type when category changes
    } else if (name === "type") {
      setSelectedType(value);
    }

    setCurrentPage(1);
  };

  return (
    <div>
      <div className="product-management-wrapper">
        <ButtonBase href="/admin/order_Dashboard" className="mt-2" style={{ color: "#323d42" }}>
          Quay lại:  trang quản lý
        </ButtonBase>
        <h3 className="text-center p-2">Quản lý sản phẩm</h3>
        {errorMessage && (
          <div className="alert alert-danger">{errorMessage}</div>
        )}

        <input
          type="text"
          className="form-control product-search-input mb-3"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={handleSearchChange}
        />

        <div className="mb-3">
          <select
            className="form-control product-category-filter mb-2"
            value={categoryFilter}
            name="category"
            onChange={handleCategoryFilterChange}
          >
            <option value="">Chọn danh mục</option>
            {Object.keys(categoryOptions).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {categoryFilter && (
          <div className="mb-3">
            <select
              className="form-control product-type-filter mb-2"
              value={selectedType}
              name="type"
              onChange={handleCategoryFilterChange}
            >
              <option value="">Chọn loại sản phẩm</option>
              {categoryOptions[categoryFilter]?.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="product-management">
          {/* Bọc bảng sản phẩm trong container có chiều cao 50vh và overflowY: auto */}
          <div style={{ height: "60vh", overflowY: "auto" }}>
            <div className="table-responsive">
              <table className="table table-bordered product-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên</th>
                    {/* <th>Danh mục</th> */}
                    <th>Loại sản phẩm</th>
                    <th>Thương hiệu</th>
                    <th>Mô tả</th>
                    <th>Giá gốc</th>
                    <th>% giảm</th>
                    <th>Giá sau giảm</th>
                    <th>SL Gốc</th>
                    <th>SL Còn</th>
                    <th>Hình ảnh</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product._id}>
                      {editingProduct?._id === product._id ? (
                        <td colSpan="12">
                          <form onSubmit={handleUpdateProduct}>
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name || ""}
                              onChange={handleEditFormChange}
                              className="form-control mb-2"
                              placeholder="Tên sản phẩm"
                            />
                            <select
                              name="category.name"
                              value={editFormData.category?.name || ""}
                              onChange={handleEditFormChange}
                              className="form-control mb-2"
                            >
                              <option value="">Chọn danh mục</option>
                              {Object.keys(categoryOptions).map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                            <select
                              name="category.generic"
                              value={editFormData.category?.generic || ""}
                              onChange={handleEditFormChange}
                              className="form-control mb-2"
                            >
                              <option value="">Chọn loại sản phẩm</option>
                              {categoryOptions[
                                editFormData.category?.name
                              ]?.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>

                            {/* --- Phần edit thương hiệu theo nhóm --- */}
                            <div className="form-group">
                              <label>Thương hiệu</label>
                              <select
                                name="brandSelect"
                                className="form-control mb-2"
                                value={editSelectedBrand}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setEditSelectedBrand(value);
                                  if (value !== "other") {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      brand: value,
                                    }));
                                  } else {
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      brand: "",
                                    }));
                                  }
                                }}
                                required
                              >
                                <option value="">Chọn thương hiệu</option>
                                {Object.entries(predefinedBrandsByCategory).map(
                                  ([group, brands]) => (
                                    <optgroup key={group} label={group}>
                                      {brands.map((brand) => (
                                        <option key={brand} value={brand}>
                                          {brand}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )
                                )}
                                <option value="other">Nhập Thương Hiệu</option>
                              </select>
                              {editSelectedBrand === "other" && (
                                <input
                                  type="text"
                                  name="brand"
                                  className="form-control mt-2"
                                  placeholder="Nhập thương hiệu"
                                  value={editFormData.brand || ""}
                                  onChange={handleEditFormChange}
                                  required
                                />
                              )}
                            </div>
                            {/* --- Kết thúc phần edit thương hiệu --- */}

                            <textarea
                              name="description"
                              value={editFormData.description || ""}
                              onChange={handleEditFormChange}
                              className="form-control mb-2"
                              placeholder="Mô tả sản phẩm"
                              style={{ height: "100px" }}
                            />
                            <input
                              type="number"
                              name="originalPrice"
                              value={editFormData.originalPrice || ""}
                              onChange={handleEditFormChange}
                              className="form-control mb-2"
                              placeholder="Giá gốc"
                            />
                            <input
                              type="number"
                              name="discountPercentage"
                              value={editFormData.discountPercentage || ""}
                              onChange={handleEditFormChange}
                              className="form-control mb-2"
                              placeholder="Giảm giá (%)"
                            />
                            <input
                              type="number"
                              name="priceAfterDiscount"
                              value={editFormData.priceAfterDiscount || ""}
                              readOnly
                              className="form-control mb-2"
                              placeholder="Giá sau giảm"
                            />
                            <div className="form-group">
                              <label>Số lượng trong kho:</label>
                              <input
                                type="number"
                                name="stock"
                                value={editFormData.stock || ""}
                                onChange={handleEditFormChange}
                                className="form-control mb-2"
                                min="0"
                                placeholder="Số lượng trong kho"
                              />
                              <small className="text-muted">
                                Số lượng hiện tại: {editFormData.stock}
                              </small>
                            </div>
                            <div className="form-group">
                              <label>Số lượng còn lại:</label>
                              <input
                                type="number"
                                name="remainingStock"
                                value={editFormData.remainingStock || ""}
                                onChange={handleEditFormChange}
                                className="form-control mb-2"
                                min="0"
                                max={editFormData.stock}
                                placeholder="Số lượng còn lại"
                              />
                              <small className="text-muted">
                                Không thể vượt quá số lượng trong kho (
                                {editFormData.stock})
                              </small>
                            </div>
                            <input
                              type="file"
                              name="images"
                              multiple
                              onChange={handleImageChange}
                              className="form-control mb-2"
                            />
                            <button
                              type="submit"
                              className="btn btn-primary btn-sm mr-2"
                              disabled={loading}
                            >
                              {loading ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleCancelEdit}
                            >
                              Hủy
                            </button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td>{index + 1}</td>
                          <td>{product.name}</td>
                          <td>{product.category.name}</td>
                          {/* <td>{product.category.generic}</td> */}
                          <td>{product.brand}</td>
                          <td>{product.description}</td>
                          <td>{product.originalPrice}</td>
                          <td>{product.discountPercentage}%</td>
                          <td>{product.priceAfterDiscount}</td>
                          <td>{product.stock}</td>
                          <td>{product.remainingStock}</td>
                          <td>
                            {product.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={product.name}
                                width="50"
                                height="50"
                                className="mr-2"
                              />
                            ))}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-secondary btn-sm mx-2"
                              onClick={() => handleEditProduct(product)}
                            >
                              sửa
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              Xóa
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-center align-items-center mt-3 flex-nowrap">
          <button
            className="btn btn-secondary btn-sm me-2"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            &laquo; Trước
          </button>
          <span>
            Trang {currentPage} của {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm ms-2"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Sau &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
