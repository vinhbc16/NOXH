package com.caovinh.noxh.mapper;

import com.caovinh.noxh.dto.request.KycRequest;
import com.caovinh.noxh.dto.request.RegisterRequest;
import com.caovinh.noxh.dto.request.UserUpdateRequest;
import com.caovinh.noxh.dto.response.UserResponse;
import com.caovinh.noxh.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "isVerified", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "kycStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "cccdNumber", ignore = true)
    @Mapping(target = "permanentAddress", ignore = true)
    @Mapping(target = "currentAddress", ignore = true)
    @Mapping(target = "province", ignore = true)
    @Mapping(target = "district", ignore = true)
    @Mapping(target = "ward", ignore = true)
    @Mapping(target = "occupation", ignore = true)
    @Mapping(target = "incomePerMonth", ignore = true)
    @Mapping(target = "householdSize", ignore = true)
    @Mapping(target = "priorityCategory", ignore = true)
    @Mapping(target = "cccdFrontUrl", ignore = true)
    @Mapping(target = "cccdBackUrl", ignore = true)
    @Mapping(target = "portraitUrl", ignore = true)
    User toUser(RegisterRequest request);

    @Mapping(target = "id", expression = "java(user.getId().toString())")
    @Mapping(target = "role", expression = "java(user.getRole().name())")
    @Mapping(target = "kycStatus", expression = "java(user.getKycStatus().name())")
    UserResponse toUserResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "isVerified", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "kycStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "cccdFrontUrl", ignore = true)
    @Mapping(target = "cccdBackUrl", ignore = true)
    @Mapping(target = "portraitUrl", ignore = true)
    void updateUserFromRequest(UserUpdateRequest request, @MappingTarget User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "phoneNumber", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "isVerified", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "kycStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "currentAddress", ignore = true)
    void updateUserFromKycRequest(KycRequest request, @MappingTarget User user);
}
