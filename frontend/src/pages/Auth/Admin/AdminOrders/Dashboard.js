import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Container, Row, Col, Form, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Cấu hình trạng thái (dùng cho thống kê đơn hàng)
const statusConfig = {
  "Đang xử lý": { color: "warning", text: "Đang xử lý" },
  "Đã xác nhận": { color: "info", text: "Đã xác nhận" },
  "Đang giao hàng": { color: "primary", text: "Đang giao hàng" },
  "Đã giao hàng": { color: "success", text: "Đã giao hàng" },
  "Đã hủy": { color: "danger", text: "Đã hủy" },
};

const Dashboard = () => {
  const [orderStats, setOrderStats] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hàm lấy thống kê đơn hàng
  const fetchOrderStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/order-stats?period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data && response.data.orderStats) {
        setOrderStats([
          {
            name: statusConfig["Đang xử lý"].text,
            orders: response.data.orderStats.processing,
          },
          {
            name: statusConfig["Đã xác nhận"].text,
            orders: response.data.orderStats.confirmed,
          },
          {
            name: statusConfig["Đang giao hàng"].text,
            orders: response.data.orderStats.shipping,
          },
          {
            name: statusConfig["Đã giao hàng"].text,
            orders: response.data.orderStats.delivered,
          },
          {
            name: statusConfig["Đã hủy"].text,
            orders: response.data.orderStats.canceled,
          },
        ]);
      } else {
        setOrderStats([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi lấy thống kê đơn hàng:", error);
      setError("Không thể tải dữ liệu đơn hàng.");
      setOrderStats([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Hàm lấy thống kê bán hàng (sản phẩm đã bán, tồn kho, bán chạy)
  const fetchSalesStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/sales-stats?period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSalesStats(response.data);
    } catch (error) {
      console.error("❌ Lỗi khi lấy thống kê bán hàng:", error);
      setError("Không thể tải dữ liệu thống kê bán hàng.");
      setSalesStats(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Gọi API mỗi khi selectedPeriod thay đổi
  useEffect(() => {
    fetchOrderStats();
    fetchSalesStats();
  }, [fetchOrderStats, fetchSalesStats]);

  // Tính số liệu dựa trên dữ liệu toàn bộ sản phẩm (toàn thời gian)
  const totalStock =
    salesStats && salesStats.totalInventory
      ? salesStats.totalInventory.totalStock
      : 0;
  const totalRemaining =
    salesStats && salesStats.totalInventory
      ? salesStats.totalInventory.totalRemaining
      : 0;
  const totalSoldCalculated = totalStock - totalRemaining;

  // Tính "Bán chạy" dựa trên mảng bestSelling (lấy giá trị lớn nhất của (stock - remainingStock))
  const bestSellingValue =
    salesStats && salesStats.bestSelling && salesStats.bestSelling.length > 0
      ? salesStats.bestSelling.reduce((max, cur) => {
          const sold = cur.stock - cur.remainingStock;
          return sold > max ? sold : max;
        }, 0)
      : 0;

  // Tạo dataset cho biểu đồ với thứ tự: "Tổng kho", "Còn lại", "Đã bán", "Bán chạy"
  const chartData = [
    { metric: "Tổng kho", value: totalStock },
    { metric: "Còn lại", value: totalRemaining },
    { metric: "Đã bán", value: totalSoldCalculated },
    { metric: "Bán chạy", value: bestSellingValue },
  ];

  // Định nghĩa mảng màu cho từng cột (4 màu riêng)
  const barColors = ["#8884d8", "#82ca9d", "#4F46E5", "#FF6F91"];

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3 text-center">📊 Bảng điều khiển quản lý</h1>
        </Col>
      </Row>

      {/* Bộ lọc thời gian */}
      <Row className="mb-4">
        <Col xs={12} md={4}>
          <Form.Group controlId="selectPeriod">
            <Form.Label>Thống kê theo:</Form.Label>
            <Form.Control
              as="select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
              <option value="quarter">Quý</option>
              <option value="year">Năm</option>
              <option value="all">Toàn thời gian</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <Row className="mb-4">
          <Col>
            <p className="text-danger">{error}</p>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        {/* Card thống kê đơn hàng */}
        <Col xs={12} md={6}>
          <Card>
            <Card.Header>
              <h2>📦 Trạng thái đơn hàng ({selectedPeriod})</h2>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Đang tải...</p>
              ) : orderStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orderStats}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>Không có dữ liệu đơn hàng.</p>
              )}
            </Card.Body>
            <Card.Footer className="text-center">
              <Link to="/admin/quan-ly-don-hang">
                <Button variant="primary">Quản lý đơn hàng</Button>
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        {/* Card thống kê bán hàng / sản phẩm */}
        <Col xs={12} md={6}>
          <Card>
            <Card.Header>
              <h2>📊 Quản lý sản phẩm ({selectedPeriod})</h2>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Đang tải...</p>
              ) : salesStats ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={barColors[index % barColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>Không có dữ liệu sản phẩm.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        
      </Row>
    </Container>
  );
};

export default Dashboard;
