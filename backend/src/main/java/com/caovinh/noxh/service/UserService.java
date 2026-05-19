package com.caovinh.noxh.service;

import com.caovinh.noxh.constant.KycStatus;
import com.caovinh.noxh.dto.request.KycRequest;
import com.caovinh.noxh.dto.request.UserUpdateRequest;
import com.caovinh.noxh.dto.response.UserResponse;
import com.caovinh.noxh.entity.User;
import com.caovinh.noxh.exception.AppException;
import com.caovinh.noxh.exception.ErrorCode;
import com.caovinh.noxh.mapper.UserMapper;
import com.caovinh.noxh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {

    UserRepository userRepository;
    UserMapper userMapper;

    public UserResponse getMyInfo() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UserUpdateRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getCccdNumber() != null
                && userRepository.existsByCccdNumber(request.getCccdNumber())
                && !request.getCccdNumber().equals(user.getCccdNumber())) {
            throw new AppException(ErrorCode.CCCD_EXISTED);
        }

        userMapper.updateUserFromRequest(request, user);
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse submitKyc(KycRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getCccdNumber() != null
                && userRepository.existsByCccdNumber(request.getCccdNumber())
                && !request.getCccdNumber().equals(user.getCccdNumber())) {
            throw new AppException(ErrorCode.CCCD_EXISTED);
        }

        userMapper.updateUserFromKycRequest(request, user);
        user.setCccdFrontUrl(request.getCccdFrontUrl());
        user.setCccdBackUrl(request.getCccdBackUrl());
        user.setPortraitUrl(request.getPortraitUrl());
        user.setKycStatus(KycStatus.VERIFIED);
        user.setIsVerified(true);
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }
}
