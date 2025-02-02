// routes/ordersRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const authMiddleware = require("../middleware/authMiddleware");
// const nodemailer = require("nodemailer");
const { sendOrderConfirmationEmail } = require('../utils/ordermail'); // Import module gửi email
const Product = require("../models/productModel");


// Route tạo đơn hàng theo tưng user
router.post("/orders", authMiddleware, async (req, res) => {
  try {
    const {
      orderId,
      items,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      userInfo,
    } = req.body;

    const userId = req.user._id;

    // Validate input
    if (
      !orderId ||
      !items ||
      !totalAmount ||
      !paymentMethod ||
      !userInfo ||
      !userInfo.email
    ) {
      return res.status(400).json({ message: "Thiếu thông tin đơn hàng!" });
    }

    const orderDate = new Date();
    const formattedDate = orderDate.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Xác định trạng thái thanh toán dựa trên phương thức
    // Sửa lại: "Đợi xác nhận" -> "Đã xác nhận" để khớp với enum trong constants
    const initialPaymentStatus =
      paymentMethod === "cod" ? "Chưa thanh toán" : "Chờ xác nhận"; // Sửa từ "Đã xác nhận" thành "Chờ xác nhận"

    const newOrder = new Order({
      orderId,
      userId,
      items,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      userInfo,
      orderStatus: "Đang xử lý",
      orderDate: orderDate,
    });

    const savedOrder = await newOrder.save();
    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "items.product"
    );

    try {
      console.log("Dữ liệu gửi email:", {
        ...req.body,
        paymentStatus: initialPaymentStatus,
        formattedOrderDate: formattedDate,
      });

      await sendOrderConfirmationEmail(
        {
          ...req.body,
          paymentStatus: initialPaymentStatus,
          formattedOrderDate: formattedDate,
        },
        userInfo.email
      );
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công!",
      order: {
        ...populatedOrder.toObject(),
        formattedOrderDate: formattedDate,
      },
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn hàng!",
      error: error.message,
    });
  }
});


// Route lấy lịch sử đơn hàng
router.get("/ordershistory", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId })
      .populate('items.product')
      .sort({ orderDate: -1 });

    const formattedOrders = orders.map(order => ({
      ...order._doc,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      formattedOrderDate: new Date(order.orderDate).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      items: order.items.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        product: item.product
      }))
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử đơn hàng!",
      error: error.message
    });
  }
});

// Route lấy chi tiết đơn hàng
router.get("/order/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      userId: req.user._id,
    }).populate({
      path: "items.product", // đảm bảo rằng populate được thực hiện đúng
      select: "name price image description category",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // Format order data
    const formattedOrder = {
      ...order._doc,
      orderDate: new Date(order.orderDate).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      items: order.items.map(item => ({
        ...item._doc,
        product: {
          ...item.product._doc,
          price: item.price, // chắc chắn rằng các thuộc tính này tồn tại trong item.product
          name: item.product.name,
          image: item.product.image
        }
      }))
    };

    res.status(200).json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết đơn hàng!",
      error: error.message,
    });
  }
});



// huy don hang
router.post("/orders/:orderId/cancel", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    console.log("Attempting to cancel order:", orderId);

    const order = await Order.findOne({
      orderId: orderId,
      userId: userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    console.log("Order found:", order);

    // Kiểm tra trạng thái có thể hủy
    const cancelableStatuses = [ORDER_STATUS.PROCESSING, ORDER_STATUS.CONFIRMED];
    if (!cancelableStatuses.includes(order.orderStatus)) {
      let message;
      switch (order.orderStatus) {
        case ORDER_STATUS.SHIPPING:
          message = "Không thể hủy đơn hàng đang trong quá trình giao hàng!";
          break;
        case ORDER_STATUS.DELIVERED:
          message = "Không thể hủy đơn hàng đã giao thành công!";
          break;
        case ORDER_STATUS.CANCELLED:
          message = "Đơn hàng này đã được hủy trước đó!";
          break;
        default:
          message = "Không thể hủy đơn hàng ở trạng thái hiện tại!";
      }

      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    // Cập nhật chỉ trạng thái đơn hàng, giữ nguyên trạng thái thanh toán
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId },
      { orderStatus: ORDER_STATUS.CANCELLED },
      { new: true, runValidators: false }
    );

    if (!updatedOrder) {
      throw new Error("Không thể cập nhật trạng thái đơn hàng");
    }

    res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công!",
      order: {
        orderId: updatedOrder.orderId,
        orderStatus: updatedOrder.orderStatus,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy đơn hàng",
      error: error.message,
    });
  }
});

// Route lấy tất cả đơn hàng của mọi người
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find() // Lấy tất cả đơn hàng
      .populate("items.product") // Populate thông tin sản phẩm trong từng đơn hàng
      .sort({ orderDate: -1 }); // Sắp xếp theo ngày đặt đơn hàng (mới nhất lên đầu)

    // Định dạng lại dữ liệu đơn hàng
    const formattedOrders = orders.map((order) => ({
      ...order._doc,
      formattedOrderDate: new Date(order.orderDate).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      items: order.items.map((item) => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        product: item.product, // Thông tin sản phẩm
      })),
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin đơn hàng!",
      error: error.message,
    });
  }
});


// Route thay đổi trạng thái đơn hàng
router.put("/order/:id", authMiddleware, async (req, res) => {
  const { id: orderId } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  try {
    // Populate items.product để có thông tin sản phẩm cần cập nhật kho
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    // Lưu lại trạng thái cũ trước khi cập nhật
    const oldOrderStatus = order.orderStatus;

    // Cập nhật trạng thái đơn hàng nếu hợp lệ
    if (orderStatus) {
      if (Object.values(ORDER_STATUS).includes(orderStatus)) {
        order.orderStatus = orderStatus;
      } else {
        return res.status(400).json({
          success: false,
          message: "Trạng thái đơn hàng không hợp lệ.",
        });
      }
    }

    // Cập nhật trạng thái thanh toán nếu hợp lệ
    if (paymentStatus) {
      if (Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
        order.paymentStatus = paymentStatus;
      } else {
        return res.status(400).json({
          success: false,
          message: "Trạng thái thanh toán không hợp lệ.",
        });
      }
    }

    // Lưu đơn hàng với trạng thái mới
    await order.save();

    // Nhóm trạng thái mà chúng ta cần trừ số lượng sản phẩm khỏi kho
    const confirmedStatus = ["Đã xác nhận", "Đang giao hàng", "Đã giao hàng"];

    // Nếu đơn hàng chuyển sang trạng thái trong nhóm xác nhận/giao hàng/đã giao
    // và trạng thái cũ không thuộc nhóm này thì trừ số lượng sản phẩm khỏi kho.
    if (confirmedStatus.includes(order.orderStatus) && !confirmedStatus.includes(oldOrderStatus)) {
      for (const item of order.items) {
        // Giả sử item.quantity là số lượng sản phẩm trong đơn hàng
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { remainingStock: -item.quantity } },
          { new: true }
        );
      }
    }

    // Nếu đơn hàng chuyển từ trạng thái đã xác nhận/đang giao/đã giao sang "Đã hủy"
    // thì hoàn trả lại số lượng sản phẩm vào kho.
    if (oldOrderStatus !== "Đã hủy" &&
        confirmedStatus.includes(oldOrderStatus) &&
        order.orderStatus === "Đã hủy") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { remainingStock: item.quantity } },
          { new: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công.",
      order,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái đơn hàng.",
      error: error.message,
    });
  }
});


const { ORDER_STATUS, PAYMENT_STATUS } = require("../constants/orderConstants");

// backend/routes/ordersRoutes.js
router.post("/payment/refund", authMiddleware, async (req, res) => {
  const { orderId, amount, paymentMethod } = req.body;

  try {
    const refundSuccess = true; // Simulate successful refund for demonstration

    if (refundSuccess) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      // Change the paymentStatus to "Hoàn tiền" (Refunded)
      order.paymentStatus = "Hoàn tiền"; // Corrected value
      await order.save();

      res.status(200).json({
        success: true,
        message: "Refund successful.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Refund failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error while processing refund:", error);
    res.status(500).json({
      success: false,
      message: "Error processing refund.",
      error: error.message,
    });
  }
});



module.exports = router;


