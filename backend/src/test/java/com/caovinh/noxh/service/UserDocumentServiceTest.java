package com.caovinh.noxh.service;

import com.caovinh.noxh.constant.DocumentType;
import com.caovinh.noxh.dto.response.FileUploadResponse;
import com.caovinh.noxh.dto.response.UserDocumentResponse;
import com.caovinh.noxh.entity.User;
import com.caovinh.noxh.entity.UserDocument;
import com.caovinh.noxh.exception.AppException;
import com.caovinh.noxh.exception.ErrorCode;
import com.caovinh.noxh.repository.UserDocumentRepository;
import com.caovinh.noxh.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDocumentServiceTest {

    @Mock
    ImageKitService imageKitService;

    @Mock
    UserDocumentRepository userDocumentRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    UserDocumentService userDocumentService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void uploadDocument_newDocument_uploadsToImageKitAndStoresReturnedUrl() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Nguyen Van An")
                .email("an@example.com")
                .password("encoded")
                .build();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "income.pdf",
                "application/pdf",
                "pdf-content".getBytes());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userDocumentRepository.findByUserIdAndDocumentType(userId, DocumentType.INCOME_CERTIFICATE))
                .thenReturn(Optional.empty());
        when(imageKitService.upload(eq(file), any(String.class))).thenReturn(FileUploadResponse.builder()
                .url("https://ik.imagekit.io/noxh/income.pdf")
                .fileName("income.pdf")
                .build());
        when(userDocumentRepository.save(any(UserDocument.class))).thenAnswer(invocation -> {
            UserDocument document = invocation.getArgument(0);
            document.setId(UUID.randomUUID());
            return document;
        });

        UserDocumentResponse response = userDocumentService.uploadDocument(DocumentType.INCOME_CERTIFICATE, file);

        ArgumentCaptor<UserDocument> documentCaptor = ArgumentCaptor.forClass(UserDocument.class);
        verify(userDocumentRepository).save(documentCaptor.capture());
        UserDocument savedDocument = documentCaptor.getValue();
        assertThat(savedDocument.getUser()).isEqualTo(user);
        assertThat(savedDocument.getDocumentType()).isEqualTo(DocumentType.INCOME_CERTIFICATE);
        assertThat(savedDocument.getFileUrl()).isEqualTo("https://ik.imagekit.io/noxh/income.pdf");
        assertThat(savedDocument.getFileName()).isEqualTo("income.pdf");
        assertThat(response.getFileUrl()).isEqualTo("https://ik.imagekit.io/noxh/income.pdf");
    }

    @Test
    void uploadDocument_usesDocumentSpecificFileNameForStorage() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Nguyen Van An")
                .email("an@example.com")
                .password("encoded")
                .build();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "cccd-back.png",
                "image/png",
                "png-content".getBytes());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userDocumentRepository.findByUserIdAndDocumentType(userId, DocumentType.CCCD_BACK))
                .thenReturn(Optional.empty());
        when(imageKitService.upload(eq(file), any(String.class))).thenReturn(FileUploadResponse.builder()
                .url("https://ik.imagekit.io/noxh/cccd-back.png")
                .fileName("cccd-back.png")
                .build());
        when(userDocumentRepository.save(any(UserDocument.class))).thenAnswer(invocation -> {
            UserDocument document = invocation.getArgument(0);
            document.setId(UUID.randomUUID());
            return document;
        });

        userDocumentService.uploadDocument(DocumentType.CCCD_BACK, file);

        ArgumentCaptor<String> fileNameCaptor = ArgumentCaptor.forClass(String.class);
        verify(imageKitService).upload(eq(file), fileNameCaptor.capture());
        assertThat(fileNameCaptor.getValue()).startsWith("cccd_back-");
        assertThat(fileNameCaptor.getValue()).endsWith(".png");
    }

    @Test
    void submitDocuments_missingRequiredDocuments_throwsRequiredDocumentsMissing() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Nguyen Van An")
                .email("an@example.com")
                .password("encoded")
                .isVerified(true)
                .kycStatus(com.caovinh.noxh.constant.KycStatus.VERIFIED)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userDocumentRepository.findByUserIdOrderByUploadedAtDesc(userId))
                .thenReturn(java.util.List.of());

        assertThatThrownBy(() -> userDocumentService.submitDocuments())
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REQUIRED_DOCUMENTS_MISSING);
    }

    @Test
    void submitDocuments_allRequiredDocumentsPresentWithoutKycVerification_returnsTrue() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Nguyen Van An")
                .email("an@example.com")
                .password("encoded")
                .isVerified(false)
                .kycStatus(com.caovinh.noxh.constant.KycStatus.PENDING)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userDocumentRepository.findByUserIdOrderByUploadedAtDesc(userId))
                .thenReturn(List.of(
                        UserDocument.builder().documentType(DocumentType.CCCD_FRONT).fileUrl("front").build(),
                        UserDocument.builder().documentType(DocumentType.CCCD_BACK).fileUrl("back").build(),
                        UserDocument.builder().documentType(DocumentType.HOUSEHOLD_REGISTRATION).fileUrl("household").build(),
                        UserDocument.builder().documentType(DocumentType.RESIDENCE_CERTIFICATE).fileUrl("residence").build(),
                        UserDocument.builder().documentType(DocumentType.INCOME_CERTIFICATE).fileUrl("income").build()
                ));

        assertThat(userDocumentService.submitDocuments()).isTrue();
    }
}
