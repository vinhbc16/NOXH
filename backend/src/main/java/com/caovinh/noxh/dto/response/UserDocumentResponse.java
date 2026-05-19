package com.caovinh.noxh.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDocumentResponse {

    String id;
    String documentType;
    String fileUrl;
    String fileName;
    String status;
    LocalDateTime uploadedAt;
}
