package com.caovinh.noxh.service;

import com.caovinh.noxh.constant.KycStatus;
import com.caovinh.noxh.dto.request.KycRequest;
import com.caovinh.noxh.dto.request.UserUpdateRequest;
import com.caovinh.noxh.dto.response.UserResponse;
import com.caovinh.noxh.entity.User;
import com.caovinh.noxh.mapper.UserMapper;
import com.caovinh.noxh.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    UserMapper userMapper;

    @InjectMocks
    UserService userService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void submitKyc_validRequestWithImageUrls_storesKycUrlsAndVerifiesUser() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Nguyen Van An")
                .email("an@example.com")
                .password("encoded")
                .build();
        KycRequest request = KycRequest.builder()
                .fullName("Nguyen Van An")
                .cccdNumber("012345678901")
                .cccdFrontUrl("https://ik.imagekit.io/noxh/cccd-front.jpg")
                .cccdBackUrl("https://ik.imagekit.io/noxh/cccd-back.jpg")
                .portraitUrl("https://ik.imagekit.io/noxh/portrait.jpg")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByCccdNumber("012345678901")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toUserResponse(any(User.class))).thenReturn(UserResponse.builder()
                .id(userId.toString())
                .kycStatus(KycStatus.VERIFIED.name())
                .isVerified(true)
                .build());

        userService.submitKyc(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getCccdFrontUrl()).isEqualTo("https://ik.imagekit.io/noxh/cccd-front.jpg");
        assertThat(savedUser.getCccdBackUrl()).isEqualTo("https://ik.imagekit.io/noxh/cccd-back.jpg");
        assertThat(savedUser.getPortraitUrl()).isEqualTo("https://ik.imagekit.io/noxh/portrait.jpg");
        assertThat(savedUser.getKycStatus()).isEqualTo(KycStatus.VERIFIED);
        assertThat(savedUser.getIsVerified()).isTrue();
    }

    @Test
    void updateProfile_withCccdAndPermanentAddress_updatesUser() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Nguyen Van An")
                .email("an@example.com")
                .password("encoded")
                .build();
        UserUpdateRequest request = UserUpdateRequest.builder()
                .fullName("Nguyen Van B")
                .cccdNumber("012345678901")
                .permanentAddress("123 Duong ABC")
                .dateOfBirth(LocalDate.of(1995, 1, 1))
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId.toString(), null));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByCccdNumber("012345678901")).thenReturn(false);
        doAnswer(invocation -> {
            UserUpdateRequest source = invocation.getArgument(0);
            User target = invocation.getArgument(1);
            target.setFullName(source.getFullName());
            target.setCccdNumber(source.getCccdNumber());
            target.setPermanentAddress(source.getPermanentAddress());
            target.setDateOfBirth(source.getDateOfBirth());
            return null;
        }).when(userMapper).updateUserFromRequest(any(UserUpdateRequest.class), any(User.class));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toUserResponse(any(User.class))).thenReturn(UserResponse.builder()
                .id(userId.toString())
                .fullName("Nguyen Van B")
                .cccdNumber("012345678901")
                .permanentAddress("123 Duong ABC")
                .build());

        userService.updateProfile(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getFullName()).isEqualTo("Nguyen Van B");
        assertThat(savedUser.getCccdNumber()).isEqualTo("012345678901");
        assertThat(savedUser.getPermanentAddress()).isEqualTo("123 Duong ABC");
    }
}
