package com.caovinh.noxh.service;

import com.caovinh.noxh.constant.KycStatus;
import com.caovinh.noxh.constant.Role;
import com.caovinh.noxh.dto.request.*;
import com.caovinh.noxh.dto.response.AuthResponse;
import com.caovinh.noxh.dto.response.UserResponse;
import com.caovinh.noxh.entity.OtpVerification;
import com.caovinh.noxh.entity.RefreshToken;
import com.caovinh.noxh.entity.User;
import com.caovinh.noxh.exception.AppException;
import com.caovinh.noxh.exception.ErrorCode;
import com.caovinh.noxh.mapper.UserMapper;
import com.caovinh.noxh.repository.OtpVerificationRepository;
import com.caovinh.noxh.repository.RefreshTokenRepository;
import com.caovinh.noxh.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthService {

    UserRepository userRepository;
    RefreshTokenRepository refreshTokenRepository;
    OtpVerificationRepository otpVerificationRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    EmailService emailService;

    @NonFinal
    @Value("${jwt.signer-key}")
    String signerKey;

    @NonFinal
    @Value("${jwt.valid-duration}")
    long validDuration;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    long refreshableDuration;

    @NonFinal
    @Value("${otp.expiry-minutes}")
    long otpExpiryMinutes;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setKycStatus(KycStatus.PENDING);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByIdentifier(request.getIdentifier())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String accessToken = generateAccessToken(user);
        String refreshTokenValue = UUID.randomUUID().toString();

        refreshTokenRepository.save(RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshableDuration))
                .build());

        setAccessTokenCookie(response, accessToken);
        setRefreshTokenCookie(response, refreshTokenValue);

        return toAuthResponse(user, accessToken);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));

        otpVerificationRepository.deleteAllByEmail(request.getEmail());

        String otp = String.format("%06d", new Random().nextInt(999999));
        otpVerificationRepository.save(OtpVerification.builder()
                .email(request.getEmail())
                .otpCode(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .build());

        emailService.sendOtpEmail(request.getEmail(), otp, user.getFullName());
    }

    public boolean verifyOtp(VerifyOtpRequest request) {
        OtpVerification otp = otpVerificationRepository
                .findLatestValid(request.getEmail(), LocalDateTime.now())
                .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));

        if (!otp.getOtpCode().equals(request.getOtp())) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }
        return true;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        OtpVerification otp = otpVerificationRepository
                .findLatestValid(request.getEmail(), LocalDateTime.now())
                .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));

        if (!otp.getOtpCode().equals(request.getOtp())) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otp.setUsed(true);
        otpVerificationRepository.save(otp);
    }

    @Transactional
    public AuthResponse refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenValue = extractCookie(request, "refresh_token");
        if (refreshTokenValue == null) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        User user = storedToken.getUser();

        // Rotate refresh token
        refreshTokenRepository.delete(storedToken);
        String newRefreshTokenValue = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder()
                .token(newRefreshTokenValue)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshableDuration))
                .build());

        String newAccessToken = generateAccessToken(user);
        setAccessTokenCookie(response, newAccessToken);
        setRefreshTokenCookie(response, newRefreshTokenValue);

        return toAuthResponse(user, newAccessToken);
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenValue = extractCookie(request, "refresh_token");
        if (refreshTokenValue != null) {
            refreshTokenRepository.findByToken(refreshTokenValue)
                    .ifPresent(token -> refreshTokenRepository.deleteAllByUserId(token.getUser().getId()));
        }
        clearTokenCookies(response);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String generateAccessToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issuer("noxh.gov.vn")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(validDuration, ChronoUnit.SECONDS)))
                .claim("scope", user.getRole().name())
                .claim("email", user.getEmail())
                .claim("fullName", user.getFullName())
                .build();

        try {
            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            signedJWT.sign(new MACSigner(signerKey.getBytes(StandardCharsets.UTF_8)));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("refresh_token", refreshToken, (int) refreshableDuration).toString());
    }

    private void setAccessTokenCookie(HttpServletResponse response, String accessToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("access_token", accessToken, (int) validDuration).toString());
    }

    private void clearTokenCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("access_token", "", 0).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("refresh_token", "", 0).toString());
    }

    private ResponseCookie buildCookie(String name, String value, int maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private AuthResponse toAuthResponse(User user, String accessToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isVerified(user.getIsVerified())
                .kycStatus(user.getKycStatus().name())
                .build();
    }
}
