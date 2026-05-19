package com.caovinh.noxh.controller;

import com.caovinh.noxh.dto.request.KycRequest;
import com.caovinh.noxh.dto.request.UserUpdateRequest;
import com.caovinh.noxh.dto.response.ApiResponse;
import com.caovinh.noxh.dto.response.FileUploadResponse;
import com.caovinh.noxh.dto.response.UserDocumentResponse;
import com.caovinh.noxh.dto.response.UserResponse;
import com.caovinh.noxh.constant.DocumentType;
import com.caovinh.noxh.service.ImageKitService;
import com.caovinh.noxh.service.UserDocumentService;
import com.caovinh.noxh.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserController {

    UserService userService;
    ImageKitService imageKitService;
    UserDocumentService userDocumentService;

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @PutMapping("/my-info")
    ApiResponse<UserResponse> updateProfile(@Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateProfile(request))
                .build();
    }

    @PostMapping("/kyc")
    ApiResponse<UserResponse> submitKyc(@Valid @RequestBody KycRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.submitKyc(request))
                .build();
    }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        return ApiResponse.<FileUploadResponse>builder()
                .result(imageKitService.upload(file))
                .build();
    }

    @GetMapping("/documents")
    ApiResponse<List<UserDocumentResponse>> getMyDocuments() {
        return ApiResponse.<List<UserDocumentResponse>>builder()
                .result(userDocumentService.getMyDocuments())
                .build();
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<UserDocumentResponse> uploadDocument(
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.<UserDocumentResponse>builder()
                .result(userDocumentService.uploadDocument(documentType, file))
                .build();
    }

    @PostMapping("/documents/submit")
    ApiResponse<Boolean> submitDocuments() {
        return ApiResponse.<Boolean>builder()
                .result(userDocumentService.submitDocuments())
                .build();
    }
}
