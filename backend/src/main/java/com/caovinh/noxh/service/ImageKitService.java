package com.caovinh.noxh.service;

import com.caovinh.noxh.dto.response.FileUploadResponse;
import com.caovinh.noxh.exception.AppException;
import com.caovinh.noxh.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@lombok.extern.slf4j.Slf4j
public class ImageKitService {

    RestClient.Builder restClientBuilder;

    @NonFinal
    @Value("${imagekit.upload-url}")
    String uploadUrl;

    @NonFinal
    @Value("${imagekit.private-key}")
    String privateKey;

    @NonFinal
    @Value("${imagekit.folder}")
    String folder;

    public FileUploadResponse upload(MultipartFile file) {
        return upload(file, file.getOriginalFilename());
    }

    public FileUploadResponse upload(MultipartFile file, String targetFileName) {
        try {
            String originalFileName = (targetFileName == null || targetFileName.isBlank())
                    ? (file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename())
                    : targetFileName;
            log.info("Uploading file to ImageKit: originalName={}, targetName={}, contentType={}, size={}",
                    file.getOriginalFilename(), originalFileName, file.getContentType(), file.getSize());
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return originalFileName;
                }
            };

            LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("fileName", originalFileName);
            body.add("folder", folder);
            body.add("useUniqueFileName", "true");

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClientBuilder.build()
                    .post()
                    .uri(uploadUrl)
                    .headers(headers -> headers.setBasicAuth(privateKey, ""))
                    .accept(MediaType.APPLICATION_JSON)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String url = response == null ? null : (String) response.get("url");
            String returnedFileName = response == null ? null : (String) response.get("name");
            if (url == null || url.isBlank()) {
                throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }

            return FileUploadResponse.builder()
                    .url(url)
                    .fileName(returnedFileName == null || returnedFileName.isBlank() ? originalFileName : returnedFileName)
                    .build();
        } catch (IOException | RestClientException e) {
            log.error("ImageKit upload failed for file: originalName={}, targetName={}, contentType={}, size={}",
                    file.getOriginalFilename(), targetFileName, file.getContentType(), file.getSize(), e);
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED, e);
        }
    }
}
