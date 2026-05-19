package com.caovinh.noxh.entity;

import com.caovinh.noxh.constant.DocumentType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_documents", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "document_type"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    DocumentType documentType;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    String fileUrl;

    @Column(name = "file_name")
    String fileName;

    @Builder.Default
    String status = "UPLOADED";

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    @Builder.Default
    LocalDateTime uploadedAt = LocalDateTime.now();
}
