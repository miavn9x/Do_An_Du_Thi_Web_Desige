import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Carousel,
} from "react-bootstrap";
import {
  FaBaby,
  FaBabyCarriage,
  FaBolt,
  FaCapsules,
  FaGlassWhiskey,
  FaHeadset,
  FaHome,
  FaPuzzlePiece,
  FaShippingFast,
  FaTags,
  FaTshirt,
  FaUndo,
  FaUtensils,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../styles/Carouselandmenu.css";
import HomeProduct from "../header/HomeProduct";
import Salecart from "../Product/Salecart";

// Component danh mục sản phẩm (hỗ trợ menu con)
const CategoryMenu = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  // Xử lý khi click vào danh mục chính (chỉ lọc theo tên danh mục)
  const handleCategoryClick = (categoryName) => {
    navigate(`/products?categoryName=${encodeURIComponent(categoryName)}`);
  };

  const handleSubcategoryClick = (categoryName, subcategory) => {
    navigate(
      `/products?categoryName=${encodeURIComponent(
        categoryName
      )}&generic=${encodeURIComponent(subcategory)}`
    );
  };

  return (
    <Card className="category-list">
      <Card.Header className="text-center pb-1">
        <span className="text-uppercase fw-bold" style={{ fontSize: "16px" }}>
          Danh mục sản phẩm
        </span>
      </Card.Header>
      <ListGroup variant="flush">
        {categories.map((category, index) => (
          <div
            key={index}
            className="category-item position-relative"
            onMouseEnter={() => setActiveCategory(index)}
            onMouseLeave={() => setActiveCategory(null)}
            style={{ cursor: "pointer" }}
          >
            <ListGroup.Item
              onClick={() => handleCategoryClick(category.name)}
              className="d-flex align-items-center"
            >
              {category.icon} <span className="ms-3">{category.name}</span>
            </ListGroup.Item>
            {/* Nếu có danh mục con thì hiển thị menu con */}
            {activeCategory === index && category.subcategories && (
              <div className="subcategory-menu position-absolute">
                {category.subcategories.map((subcategory, subIndex) => (
                  <div
                    key={subIndex}
                    className="subcategory-item"
                    onClick={(e) => {
                      // Ngăn sự kiện click lan lên danh mục cha
                      e.stopPropagation();
                      handleSubcategoryClick(category.name, subcategory);
                    }}
                  >
                    {subcategory}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </ListGroup>
    </Card>
  );
};

// Component InfoCard tái sử dụng
const InfoCard = ({ icon, title, description }) => (
  <Card className="info-item">
    <Card.Body>
      {icon && React.cloneElement(icon, { className: "me-2" })}
      <span>
        {title}
        <br />
        {description}
      </span>
    </Card.Body>
  </Card>
);

const CarouselAndMenu = () => {
  const categories = [
    {
      icon: <FaBabyCarriage />,
      name: "Sữa bột cao cấp",
      subcategories: [
        "Sữa bột cho bé 0-6 tháng",
        "Sữa bột cho bé 6-12 tháng",
        "Sữa bột cho bé 1-3 tuổi",
        "Sữa bột cho bé 3-5 tuổi",
        "Sữa bột organic",
        "Sữa non tăng đề kháng",
      ],
    },
    {
      icon: <FaGlassWhiskey />,
      name: "Sữa dinh dưỡng",
      subcategories: [
        "Sữa cho mẹ bầu",
        "Sữa tăng canxi cho bà bầu",
        "Sữa cho mẹ sau sinh",
        "Sữa cho bé từ 1 tuổi",
        "Sữa tăng chiều cao cho bé 3-5 tuổi",
      ],
    },
    {
      icon: <FaTags />,
      name: "Bỉm & tã em bé",
      subcategories: [
        "Bỉm sơ sinh (< 5kg)",
        "Bỉm size S (4-8kg)",
        "Bỉm size M (6-11kg)",
        "Bỉm size L (9-14kg)",
        "Bỉm size XL (12-17kg)",
        "Bỉm quần cho bé tập đi",
      ],
    },
    {
      icon: <FaPuzzlePiece />,
      name: "Đồ chơi phát triển",
      subcategories: [
        "Đồ chơi bé gái",
        "Đồ chơi bé trai",
        "Sách, học tập",
        "Đồ chơi sơ sinh",
        "Scooter, vận động",
      ],
    },
    {
      icon: <FaHome />,
      name: "Chăm sóc mẹ và bé",
      subcategories: [
        "Chăm sóc da bầu (chống rạn)",
        "Dầu massage bầu",
        "Kem dưỡng da cho bé",
        "Dầu tắm gội cho bé",
        "Phấn rôm chống hăm",
        "Nhiệt kế & Máy hút mũi",
      ],
    },
    {
      icon: <FaTshirt />,
      name: "Thời trang mẹ và bé",
      subcategories: [
        "Đồ bầu theo tháng (1-8 tháng)",
        "Váy bầu công sở",
        "Đồ sau sinh",
        "Quần áo sơ sinh (0-12 tháng)",
        "Quần áo bé 1-3 tuổi",
        "Quần áo bé 3-5 tuổi",
      ],
    },
    {
      icon: <FaCapsules />,
      name: "Dinh dưỡng bà bầu",
      subcategories: [
        "Vitamin tổng hợp cho bà bầu",
        "Sắt và axit folic",
        "Canxi và Vitamin D3",
        "Omega 3 và DHA",
        "Sữa bầu công thức đặc biệt",
      ],
    },
    {
      icon: <FaUtensils />,
      name: "Ăn dặm cho bé",
      subcategories: [
        "Bột ăn dặm 6-8 tháng",
        "Bột ăn dặm 8-12 tháng",
        "Cháo ăn dặm 12-24 tháng",
        "Bánh ăn dặm",
        "Vitamin & Khoáng chất ăn dặm",
        "Dụng cụ ăn dặm",
      ],
    },
    {
      icon: <FaCapsules />,
      name: "Dinh dưỡng cho bé",
      subcategories: [
        "Vitamin tổng hợp cho bé 0-12 tháng",
        "Vitamin cho bé 1-3 tuổi",
        "Vitamin cho bé 3-5 tuổi",
        "Men vi sinh cho bé",
        "Kẽm & Sắt cho bé",
        "DHA cho bé",
      ],
    },
    {
      icon: <FaBaby />,
      name: "Đồ dùng thiết yếu",
      subcategories: [
        "Máy hút sữa & Phụ kiện",
        "Bình sữa & Núm ti",
        "Máy tiệt trùng & Hâm sữa",
        "Nôi & Cũi cho bé",
        "Xe đẩy & Địu",
        "Ghế ăn & Ghế rung",
      ],
    },
  ];

  return (
    <>
      <Container className="mt-3 container_custom">
        <Row>
          {/* Sidebar danh mục (chỉ hiển thị ở màn hình lớn) */}
          <Col xs={12} lg={3} className="d-none d-lg-block">
            <CategoryMenu categories={categories} />
          </Col>

          {/* Nội dung chính */}
          <Col xs={12} lg={9}>
            <Carousel
              id="carouselExampleIndicators"
              className="carousel-custom"
            >
              <Carousel.Item>
                <img
                  src="https://bizweb.dktcdn.net/100/531/894/themes/976680/assets/home_slider_2.jpg"
                  className="d-block w-100"
                  alt="Banner 1"
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  src="https://bizweb.dktcdn.net/100/531/894/themes/976680/assets/home_slider_1.jpg"
                  className="d-block w-100"
                  alt="Banner 2"
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  src="https://theme.hstatic.net/200000381339/1001207774/14/slider_6.jpg?v=165"
                  className="d-block w-100"
                  alt="Banner 3"
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  src="https://cdn1.concung.com/img/adds/2025/01/1736402117-banner-2400x906-1-.png"
                  className="d-block w-100"
                  alt="Banner 4"
                />
              </Carousel.Item>
            </Carousel>

            {/* Info Section */}
            <Row className="info-section mt-4 d-none d-md-flex">
              <Col xs={12} sm={6} md={3} className="mb-4">
                <InfoCard
                  icon={<FaShippingFast />}
                  title="Giao hoả tốc"
                  description="Nội thành TP. HCM trong 4h"
                />
              </Col>
              <Col xs={12} sm={6} md={3} className="mb-4">
                <InfoCard
                  icon={<FaUndo />}
                  title="Đổi trả miễn phí"
                  description="Trong vòng 30 ngày miễn phí"
                />
              </Col>
              <Col xs={12} sm={6} md={3} className="mb-4">
                <InfoCard
                  icon={<FaHeadset />}
                  title="Hỗ trợ 24/7"
                  description="Hỗ trợ khách hàng 24/7"
                />
              </Col>
              <Col xs={12} sm={6} md={3} className="mb-4">
                <InfoCard
                  icon={<FaBolt />}
                  title="Hot bùng nổ"
                  description="Flash sale giảm giá cực sốc"
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

        <Salecart />

      <div>
        <HomeProduct />
      </div>
    </>
  );
};

export default CarouselAndMenu;