package com.caovinh.noxh.entity;

import com.caovinh.noxh.constant.KycStatus;
import com.caovinh.noxh.constant.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "full_name", nullable = false)
    String fullName;

    @Column(unique = true, nullable = false)
    String email;

    @Column(name = "phone_number", unique = true)
    String phoneNumber;

    @Column(name = "cccd_number", unique = true)
    String cccdNumber;

    @Column(nullable = false)
    String password;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    String gender;

    @Column(name = "permanent_address")
    String permanentAddress;

    @Column(name = "current_address")
    String currentAddress;

    String province;
    String district;
    String ward;
    String occupation;

    @Column(name = "income_per_month")
    Long incomePerMonth;

    @Column(name = "household_size")
    Integer householdSize;

    @Column(name = "priority_category")
    String priorityCategory;

    @Column(name = "cccd_front_url", columnDefinition = "TEXT")
    String cccdFrontUrl;

    @Column(name = "cccd_back_url", columnDefinition = "TEXT")
    String cccdBackUrl;

    @Column(name = "portrait_url", columnDefinition = "TEXT")
    String portraitUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    Role role = Role.USER;

    @Column(name = "is_verified")
    @Builder.Default
    Boolean isVerified = false;

    @Column(name = "is_active")
    @Builder.Default
    Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status")
    @Builder.Default
    KycStatus kycStatus = KycStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
