import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../../../styles/UserPage.css";
import { Spinner } from "react-bootstrap"; // Import Spinner từ react-bootstrap

function UserPage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState({
    general: null,
    password: {
      currentPassword: null,
      newPassword: null,
    },
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm state loading

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError((prevError) => ({
        ...prevError,
        general: "Token không tồn tại. Vui lòng đăng nhập lại.",
      }));
      setLoading(false); // Dừng loading khi có lỗi
      return;
    }

    axios
      .get(`/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const userData = response.data.user;
        setUser(userData);
        setEditData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          email: userData.email,
        });
        setLoading(false); // Dừng loading khi dữ liệu được tải xong
      })
      .catch((err) => {
        setError((prevError) => ({
          ...prevError,
          general: "Không thể lấy thông tin người dùng. Vui lòng thử lại sau.",
        }));
        setLoading(false); // Dừng loading khi có lỗi
      });
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError({
        ...error,
        general: "Token không tồn tại. Vui lòng đăng nhập lại.",
      });
      return;
    }

    setLoading(true); // Bật loading khi gửi yêu cầu cập nhật

    axios
      .put(`/api/profile`, editData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUser(response.data.user);
        setIsEditing(false);
        setSuccessMessage("Cập nhật thông tin thành công!");
        setError({
          general: null,
          password: { currentPassword: null, newPassword: null },
        });
        setLoading(false); // Dừng loading khi thành công
      })
      .catch((err) => {
        setError({
          ...error,
          general: "Không thể cập nhật thông tin người dùng.",
        });
        setLoading(false); // Dừng loading khi có lỗi
      });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSubmitPasswordChange = (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError((prevError) => ({
        ...prevError,
        password: {
          ...prevError.password,
          newPassword: "Vui lòng nhập mật khẩu cũ và mật khẩu mới.",
        },
      }));
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError((prevError) => ({
        ...prevError,
        password: {
          ...prevError.password,
          newPassword: "Mật khẩu mới không thể giống mật khẩu cũ.",
        },
      }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError({
        ...error,
        general: "Token không tồn tại. Vui lòng đăng nhập lại.",
      });
      return;
    }

    const data = {
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };

    setLoading(true); // Bật loading khi gửi yêu cầu đổi mật khẩu

    axios
      .put(`/api/profile/password`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setSuccessMessage("Đổi mật khẩu thành công!");
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: "", newPassword: "" });
        setError({
          general: null,
          password: { currentPassword: null, newPassword: null },
        });
        localStorage.setItem("token", response.data.token);
        setLoading(false); // Dừng loading khi thành công
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          setError({
            ...error,
            password: {
              ...error.password,
              currentPassword: "Mật khẩu cũ không đúng.",
            },
          });
        } else {
          setError({
            ...error,
            password: {
              ...error.password,
              newPassword: "Không thể thay đổi mật khẩu.",
            },
          });
        }
        setLoading(false); // Dừng loading khi có lỗi
      });
  };

  if (error.general) {
    return <div className="text-danger">{error.general}</div>;
  }

  if (loading) {
    return (
      <div className="loading-container text-center">
        <Spinner
          animation="border"
          variant="success" // Vòng xoay màu xanh
          className="loading-spinner"
        />
        <div>Đang tải thông tin...</div>
      </div>
    );
  }

  if (!user) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="user-page container mt-5 justify-content-center">
      <h2>Thông tin cá nhân</h2>

      {successMessage && <div className="text-success">{successMessage}</div>}

      {isEditing ? (
        <form onSubmit={handleSubmitEdit}>
          <div className="mb-3">
            <label className="form-label">Họ và Tên</label>
            <input
              type="text"
              className="form-control"
              name="fullName"
              value={`${editData.firstName} ${editData.lastName}`}
              onChange={(e) => {
                const [firstName, ...lastNameParts] = e.target.value.split(" ");
                setEditData({
                  ...editData,
                  firstName: firstName || "",
                  lastName: lastNameParts.join(" ") || "",
                });
              }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={editData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Số điện thoại</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={editData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="button-group d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              Lưu thay đổi
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p>
            <strong>Họ và tên:</strong> {user.firstName} {user.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Số điện thoại:</strong> {user.phone}
          </p>

          <div className="button-group">
            <button
              className="btn btn-warning"
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      )}

      <h3 className="mt-5">Đổi mật khẩu</h3>
      {isChangingPassword ? (
        <form onSubmit={handleSubmitPasswordChange}>
          <div className="mb-3">
            <label className="form-label">Mật khẩu hiện tại</label>
            <input
              type="password"
              className={`form-control ${
                error.password.currentPassword ? "is-invalid" : ""
              }`}
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
            {error.password.currentPassword && (
              <div className="invalid-feedback">
                {error.password.currentPassword}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Mật khẩu mới</label>
            <input
              type="password"
              className={`form-control ${
                error.password.newPassword ? "is-invalid" : ""
              }`}
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
            {error.password.newPassword && (
              <div className="invalid-feedback">
                {error.password.newPassword}
              </div>
            )}
          </div>
          <div className="button-group d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              Đổi mật khẩu
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsChangingPassword(false);
                setError({
                  ...error,
                  password: { currentPassword: null, newPassword: null },
                });
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <div className="button-group">
          <button
            className="btn btn-warning"
            onClick={() => setIsChangingPassword(true)}
          >
            Đổi mật khẩu
          </button>
        </div>
      )}
    </div>
  );
}

export default UserPage;
