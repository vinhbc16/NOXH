package com.caovinh.noxh.exception;

import com.caovinh.noxh.dto.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleMultipartException_returnsPayloadTooLargeError() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleMultipartException(
                new MaxUploadSizeExceededException(1024 * 1024));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(ErrorCode.FILE_TOO_LARGE.getCode());
        assertThat(response.getBody().getMessage()).isEqualTo(ErrorCode.FILE_TOO_LARGE.getMessage());
    }
}
