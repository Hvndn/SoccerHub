package com.soccerhub.repository;

import com.soccerhub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Optional<User> findByPhone(String phone);
    Boolean existsByPhone(String phone);
    Optional<User> findByEmailOrPhone(String email, String phone);
}
