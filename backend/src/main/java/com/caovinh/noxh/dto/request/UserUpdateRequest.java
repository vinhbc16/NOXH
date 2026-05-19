package com.caovinh.noxh.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {

    String fullName;
    String phoneNumber;
    String cccdNumber;
    LocalDate dateOfBirth;
    String gender;
    String permanentAddress;
    String province;
    String district;
    String ward;
    String currentAddress;
    String occupation;
    Long incomePerMonth;
    Integer householdSize;
    String priorityCategory;
}
