package com.soccerhub.service;

import com.soccerhub.dto.CreatePitchRequest;
import com.soccerhub.model.Pitch;
import com.soccerhub.model.User;
import com.soccerhub.repository.PitchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PitchService {

    private final PitchRepository pitchRepository;

    public Pitch createPitch(CreatePitchRequest req, User owner) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập tên cụm sân bóng đá.");
        }
        if (req.getAddress() == null || req.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập địa chỉ cụm sân.");
        }

        Pitch pitch = Pitch.builder()
                .name(req.getName().trim())
                .address(req.getAddress().trim())
                .area(req.getArea() != null ? req.getArea().trim() : "Quận 7, TP.HCM")
                .phone(req.getPhone() != null ? req.getPhone().trim() : (owner != null ? owner.getPhone() : null))
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : "Chủ Sân SoccerHub")
                .latitude(req.getLatitude() != null ? req.getLatitude() : 10.7412)
                .longitude(req.getLongitude() != null ? req.getLongitude() : 106.7123)
                .avgPricePerHour(req.getAvgPricePerHour() != null ? req.getAvgPricePerHour() : 350000)
                .peakPricePerHour(req.getPeakPricePerHour() != null ? req.getPeakPricePerHour() : 450000)
                .pitchTypes(req.getPitchTypes() != null && !req.getPitchTypes().isEmpty() 
                        ? req.getPitchTypes() 
                        : List.of("PITCH_7", "PITCH_5"))
                .amenities(req.getAmenities() != null && !req.getAmenities().isEmpty()
                        ? req.getAmenities()
                        : List.of("Đèn LED 1000 Lux", "Căn tin & Nước uống", "Bãi xe ô tô", "Phòng thay đồ"))
                .imageUrl(req.getImageUrl() != null && !req.getImageUrl().trim().isEmpty()
                        ? req.getImageUrl().trim()
                        : "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80")
                .description(req.getDescription())
                .rating(5.0)
                .build();

        return pitchRepository.save(pitch);
    }

    public List<Pitch> getAllPitches() {
        return pitchRepository.findAll();
    }

    public List<Pitch> getPitchesByOwner(User owner) {
        if (owner == null) return List.of();
        return pitchRepository.findByOwnerId(owner.getId());
    }

    public Pitch getPitchById(Long id) {
        return pitchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cụm sân bóng đá với mã ID: " + id));
    }

    public void deletePitch(Long id, User owner) {
        Pitch pitch = getPitchById(id);
        if (pitch.getOwnerId() != null && owner != null && !owner.getId().equals(pitch.getOwnerId()) && !owner.getRole().name().equals("ADMIN")) {
            throw new IllegalArgumentException("Bạn không có quyền xóa cụm sân này.");
        }
        pitchRepository.delete(pitch);
    }

    public void clearAllPitches() {
        pitchRepository.deleteAll();
    }
}
