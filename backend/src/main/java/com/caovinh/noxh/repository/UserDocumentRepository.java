package com.caovinh.noxh.repository;

import com.caovinh.noxh.constant.DocumentType;
import com.caovinh.noxh.entity.UserDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDocumentRepository extends JpaRepository<UserDocument, UUID> {

    List<UserDocument> findByUserIdOrderByUploadedAtDesc(UUID userId);

    Optional<UserDocument> findByUserIdAndDocumentType(UUID userId, DocumentType documentType);
}
