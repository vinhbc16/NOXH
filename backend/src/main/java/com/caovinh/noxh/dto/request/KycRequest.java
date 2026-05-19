package com.caovinh.noxh.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KycRequest {

    @NotBlank(message = "FIELD_REQUIRED")
    String fullName;

    LocalDate dateOfBirth;
    String gender;

    @NotBlank(message = "FIELD_REQUIRED")
    String cccdNumber;

    @NotBlank(message = "FIELD_REQUIRED")
    String cccdFrontUrl;

    @NotBlank(message = "FIELD_REQUIRED")
    String cccdBackUrl;

    @NotBlank(message = "FIELD_REQUIRED")
    String portraitUrl;

    String permanentAddress;
    String province;
    String district;
    String ward;
    String occupation;
    Long incomePerMonth;
    Integer householdSize;
    String priorityCategory;
}
