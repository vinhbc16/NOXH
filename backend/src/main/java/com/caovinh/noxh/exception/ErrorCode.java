package com.caovinh.noxh.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User already existed", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1003, "Invalid email format", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_CREDENTIALS(1008, "Invalid credentials", HttpStatus.UNAUTHORIZED),
    OTP_INVALID(1009, "OTP is invalid or expired", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(1010, "OTP has expired", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_FOUND(1011, "Email not found", HttpStatus.NOT_FOUND),
    PROJECT_NOT_FOUND(1012, "Project not found", HttpStatus.NOT_FOUND),
    APPLICATION_EXISTED(1013, "Application already existed for this project", HttpStatus.BAD_REQUEST),
    APPLICATION_NOT_FOUND(1014, "Application not found", HttpStatus.NOT_FOUND),
    INVALID_TOKEN(1015, "Invalid token", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(1016, "Token has expired", HttpStatus.UNAUTHORIZED),
    FIELD_REQUIRED(1017, "Field is required", HttpStatus.BAD_REQUEST),
    INVALID_FORMAT(1018, "Invalid format", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1019, "Phone number already existed", HttpStatus.BAD_REQUEST),
    CCCD_EXISTED(1020, "CCCD number already existed", HttpStatus.BAD_REQUEST),
    PROVINCE_NOT_FOUND(1021, "Province not found", HttpStatus.NOT_FOUND),
    DISTRICT_NOT_FOUND(1022, "District not found", HttpStatus.NOT_FOUND),
    IMAGE_UPLOAD_FAILED(1023, "Image upload failed", HttpStatus.BAD_GATEWAY),
    KYC_NOT_VERIFIED(1024, "KYC is not verified", HttpStatus.BAD_REQUEST),
    REQUIRED_DOCUMENTS_MISSING(1025, "Required documents are missing", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1026, "Uploaded file is too large", HttpStatus.PAYLOAD_TOO_LARGE),
    ;

    final int code;
    final String message;
    final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
