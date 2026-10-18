package com.turfzone.service;

import com.turfzone.dto.CreatePitchRequest;
import com.turfzone.model.Pitch;
import com.turfzone.model.User;
import com.turfzone.repository.PitchRepository;
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
                .area(req.getArea() != null ? req.getArea().trim() : null)
                .phone(req.getPhone() != null ? req.getPhone().trim() : (owner != null ? owner.getPhone() : null))
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : "Chủ Sân Turfzone")
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .avgPricePerHour(req.getAvgPricePerHour() != null ? req.getAvgPricePerHour() : 350000)
                .peakPricePerHour(req.getPeakPricePerHour() != null ? req.getPeakPricePerHour() : 450000)
                .openTime(req.getOpenTime() != null ? req.getOpenTime().trim() : "14:00")
                .closeTime(req.getCloseTime() != null ? req.getCloseTime().trim() : "22:30")
                .slotDurationMinutes(req.getSlotDurationMinutes() != null ? req.getSlotDurationMinutes() : 120)
                // Không bịa bộ môn/tiện ích mẫu: không khai báo thì để trống
                .pitchTypes(req.getPitchTypes() != null ? req.getPitchTypes() : List.of())
                .amenities(req.getAmenities() != null ? req.getAmenities() : List.of())
                .imageUrl(req.getImageUrl() != null && !req.getImageUrl().trim().isEmpty()
                        ? req.getImageUrl().trim()
                        : "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80")
                .description(req.getDescription())
                .rating(5.0)
                .build();

        return pitchRepository.save(pitch);
    }

/**
     * Kiểm tra quyền sở hữu cụm sân (chống IDOR).
     *
     * <p>Chỉ ADMIN được phép đụng vào mọi cụm sân. Chủ sân chỉ được sửa cụm sân
     * do chính họ tạo. Cụm sân chưa gán chủ (dữ liệu seed / cụm sân công cộng)
     * thì chỉ ADMIN mới sửa được — tránh việc mọi chủ sân đều chiếm đoạt sân
     * không có chủ.</p>
     *
     * @throws IllegalArgumentException nếu không có quyền
     */
    private void assertCanManage(Pitch pitch, User actor) {
        if (actor == null) {
            throw new IllegalArgumentException("Cần đăng nhập để quản lý cụm sân.");
        }
        boolean isAdmin = actor.getRole() != null && "ADMIN".equals(actor.getRole().name());
        if (isAdmin) return;

        if (pitch.getOwnerId() == null) {
            throw new IllegalArgumentException("Cụm sân này chưa có chủ sở hữu, chỉ Quản Trị viên được phép cập nhật.");
        }
        if (!pitch.getOwnerId().equals(actor.getId())) {
            throw new IllegalArgumentException("Bạn không phải chủ sân của cụm sân này.");
        }
    }

    /** Cập nhật giờ mở/đóng cửa + độ dài mỗi ca. Yêu cầu đúng chủ sân (hoặc ADMIN). */
    public Pitch updateOperatingHours(Long id, String openTime, String closeTime,
                                      Integer slotDurationMinutes, User actor) {
        Pitch pitch = getPitchById(id);
        assertCanManage(pitch, actor);
        if (openTime != null && !openTime.trim().isEmpty()) {
            pitch.setOpenTime(openTime.trim());
        }
        if (closeTime != null && !closeTime.trim().isEmpty()) {
            pitch.setCloseTime(closeTime.trim());
        }
        if (slotDurationMinutes != null && slotDurationMinutes > 0) {
            pitch.setSlotDurationMinutes(slotDurationMinutes);
        }
        return pitchRepository.save(pitch);
    }

    /**
     * Cập nhật giá thuê sân: giá thường (avgPricePerHour) và giá giờ vàng (peakPricePerHour).
     * Các trường null hoặc <= 0 sẽ được giữ nguyên.
     */
    public Pitch updatePrice(Long id, Integer avgPricePerHour, Integer peakPricePerHour, User actor) {
        Pitch pitch = getPitchById(id);
        assertCanManage(pitch, actor);
        if (avgPricePerHour != null && avgPricePerHour > 0) {
            pitch.setAvgPricePerHour(avgPricePerHour);
        }
        if (peakPricePerHour != null && peakPricePerHour > 0) {
            pitch.setPeakPricePerHour(peakPricePerHour);
        }
        if (pitch.getPeakPricePerHour() != null && pitch.getAvgPricePerHour() != null
                && pitch.getPeakPricePerHour() < pitch.getAvgPricePerHour()) {
            throw new IllegalArgumentException("Giá giờ vàng phải lớn hơn hoặc bằng giá thường.");
        }
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
