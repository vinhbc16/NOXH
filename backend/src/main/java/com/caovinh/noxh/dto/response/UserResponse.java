package com.caovinh.noxh.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    String id;
    String fullName;
    String email;
    String phoneNumber;
    String cccdNumber;
    LocalDate dateOfBirth;
    String gender;
    String province;
    String district;
    String ward;
    String currentAddress;
    String permanentAddress;
    String occupation;
    Long incomePerMonth;
    Integer householdSize;
    String priorityCategory;
    String cccdFrontUrl;
    String cccdBackUrl;
    String portraitUrl;
    String role;
    Boolean isVerified;
    String kycStatus;
    LocalDateTime createdAt;
}
