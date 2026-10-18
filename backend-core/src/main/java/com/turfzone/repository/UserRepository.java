package com.turfzone.repository;

import com.turfzone.model.User;
import com.turfzone.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByPhone(String phone);

    Boolean existsByPhone(String phone);

    Optional<User> findByEmailOrPhone(String email, String phone);

    /** Đếm số tài khoản theo vai trò (dùng để không tạo lại admin mặc định khi đã có admin khác). */
    long countByRole(UserRole role);

    /** Danh sách email theo vai trò — dùng cho kiểm tra seed tài khoản demo. */
    List<User> findByRole(UserRole role);
}