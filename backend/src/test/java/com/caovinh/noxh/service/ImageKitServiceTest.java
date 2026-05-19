package com.caovinh.noxh.service;

import com.caovinh.noxh.dto.response.FileUploadResponse;
import com.caovinh.noxh.exception.AppException;
import com.caovinh.noxh.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ImageKitServiceTest {

    @Test
    void upload_validResponse_returnsUploadedUrl() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        ImageKitService imageKitService = new ImageKitService(restClientBuilder);
        ReflectionTestUtils.setField(imageKitService, "uploadUrl", "https://upload.imagekit.io/api/v1/files/upload");
        ReflectionTestUtils.setField(imageKitService, "privateKey", "private-key");
        ReflectionTestUtils.setField(imageKitService, "folder", "/NOXH");

        server.expect(requestTo("https://upload.imagekit.io/api/v1/files/upload"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {"url":"https://ik.imagekit.io/noxh/front.jpg","name":"front.jpg"}
                        """, MediaType.APPLICATION_JSON));

        FileUploadResponse response = imageKitService.upload(new MockMultipartFile(
                "file",
                "front.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "binary".getBytes()));

        assertThat(response.getUrl()).isEqualTo("https://ik.imagekit.io/noxh/front.jpg");
        assertThat(response.getFileName()).isEqualTo("front.jpg");
        server.verify();
    }

    @Test
    void upload_withProvidedFileName_usesOverrideWhenCallingImageKit() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).bufferContent().build();
        ImageKitService imageKitService = new ImageKitService(restClientBuilder);
        ReflectionTestUtils.setField(imageKitService, "uploadUrl", "https://upload.imagekit.io/api/v1/files/upload");
        ReflectionTestUtils.setField(imageKitService, "privateKey", "private-key");
        ReflectionTestUtils.setField(imageKitService, "folder", "/NOXH");

        server.expect(requestTo("https://upload.imagekit.io/api/v1/files/upload"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(request -> assertThat(request.getBody().toString()).contains("cccd_back-123.png"))
                .andRespond(withSuccess("""
                        {"url":"https://ik.imagekit.io/noxh/cccd_back-123.png","name":"cccd_back-123.png"}
                        """, MediaType.APPLICATION_JSON));

        FileUploadResponse response = imageKitService.upload(new MockMultipartFile(
                "file",
                "front.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "binary".getBytes()), "cccd_back-123.png");

        assertThat(response.getUrl()).isEqualTo("https://ik.imagekit.io/noxh/cccd_back-123.png");
        assertThat(response.getFileName()).isEqualTo("cccd_back-123.png");
        server.verify();
    }

    @Test
    void upload_missingUrl_throwsImageUploadFailed() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        ImageKitService imageKitService = new ImageKitService(restClientBuilder);
        ReflectionTestUtils.setField(imageKitService, "uploadUrl", "https://upload.imagekit.io/api/v1/files/upload");
        ReflectionTestUtils.setField(imageKitService, "privateKey", "private-key");
        ReflectionTestUtils.setField(imageKitService, "folder", "/NOXH");

        server.expect(requestTo("https://upload.imagekit.io/api/v1/files/upload"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {"name":"front.jpg"}
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> imageKitService.upload(new MockMultipartFile(
                "file",
                "front.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "binary".getBytes())))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.IMAGE_UPLOAD_FAILED);
    }

    @Test
    void upload_ioFailure_preservesOriginalCause() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        ImageKitService imageKitService = new ImageKitService(restClientBuilder);
        ReflectionTestUtils.setField(imageKitService, "uploadUrl", "https://upload.imagekit.io/api/v1/files/upload");
        ReflectionTestUtils.setField(imageKitService, "privateKey", "private-key");
        ReflectionTestUtils.setField(imageKitService, "folder", "/NOXH");

        MultipartFile brokenFile = new MultipartFile() {
            @Override
            public String getName() {
                return "file";
            }

            @Override
            public String getOriginalFilename() {
                return "broken.jpg";
            }

            @Override
            public String getContentType() {
                return MediaType.IMAGE_JPEG_VALUE;
            }

            @Override
            public boolean isEmpty() {
                return false;
            }

            @Override
            public long getSize() {
                return 12;
            }

            @Override
            public byte[] getBytes() throws IOException {
                throw new IOException("boom");
            }

            @Override
            public InputStream getInputStream() throws IOException {
                throw new IOException("boom");
            }

            @Override
            public void transferTo(java.io.File dest) throws IOException, IllegalStateException {
                throw new IOException("boom");
            }
        };

        assertThatThrownBy(() -> imageKitService.upload(brokenFile))
                .isInstanceOf(AppException.class)
                .hasCauseInstanceOf(IOException.class);
    }
}
