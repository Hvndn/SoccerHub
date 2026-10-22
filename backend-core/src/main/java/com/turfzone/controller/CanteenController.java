package com.turfzone.controller;

import com.turfzone.model.CanteenItem;
import com.turfzone.model.Pitch;
import com.turfzone.model.User;
import com.turfzone.repository.CanteenItemRepository;
import com.turfzone.repository.PitchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * API Quản lý dịch vụ Canteen & cho thuê vật tư tại quầy.
 *
 * <p>Trước đây tab này ở giao diện chỉ hiện dữ liệu mẫu cứng và nút "Lưu kho"
 * chỉ bật thông báo — không có gì được lưu. Nay mọi thao tác đều xuống CSDL.</p>
 */
@RestController
@RequestMapping("/api/v1/canteen")
@RequiredArgsConstructor
public class CanteenController {

    private final CanteenItemRepository canteenItemRepository;
    private final PitchRepository pitchRepository;

    /** Danh sách món của cụm sân đang chọn (chủ sân) hoặc toàn hệ thống (ADMIN). */
    @GetMapping("/items")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> listItems(@RequestParam(required = false) Long pitchId,
                                     @AuthenticationPrincipal User me) {
        if (me == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập."));
        }
        boolean isAdmin = "ADMIN".equals(me.getRole().name());
        List<CanteenItem> items;
        if (isAdmin && pitchId == null) {
            items = canteenItemRepository.findAll();
        } else if (pitchId != null) {
            Pitch pitch = pitchRepository.findById(pitchId).orElse(null);
            if (pitch == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cụm sân không tồn tại."));
            }
            if (!isAdmin && (pitch.getOwnerId() == null || !pitch.getOwnerId().equals(me.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Bạn không phải chủ sân của cụm sân này."));
            }
            items = canteenItemRepository.findByPitchIdOrderByNameAsc(pitchId);
        } else {
            items = canteenItemRepository.findByOwnerIdOrderByNameAsc(me.getId());
        }
        return ResponseEntity.ok(items);
    }

    /** Thêm mới một món. */
    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Transactional
    public ResponseEntity<?> createItem(@RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal User me) {
        if (me == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập."));
        }
        String name = str(req.get("name"));
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập tên món."));
        }
        Long pitchId = longOf(req.get("pitchId"));
        Integer price = intOf(req.get("price"));
        if (pitchId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn cụm sân."));
        }
        if (price == null || price <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giá bán phải lớn hơn 0."));
        }
        Pitch pitch = pitchRepository.findById(pitchId).orElse(null);
        if (pitch == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cụm sân không tồn tại."));
        }
        boolean isAdmin = "ADMIN".equals(me.getRole().name());
        if (!isAdmin && (pitch.getOwnerId() == null || !pitch.getOwnerId().equals(me.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không phải chủ sân của cụm sân này."));
        }
        Integer stock = intOf(req.get("stock"));
        CanteenItem item = CanteenItem.builder()
                .pitchId(pitchId)
                .ownerId(pitch.getOwnerId() != null ? pitch.getOwnerId() : me.getId())
                .name(name.trim())
                .unit(str(req.get("unit")))
                .price(price)
                .stock(stock != null && stock >= 0 ? stock : 0)
                .soldToday(0)
                .soldDate(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(canteenItemRepository.save(item));
    }

    /** Sửa tên / giá / tồn kho. */
    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Transactional
    public ResponseEntity<?> updateItem(@PathVariable Long id,
                                       @RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal User me) {
        CanteenItem item = canteenItemRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy món này."));
        }
        if (!canManage(item, me)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền sửa món của cụm sân này."));
        }
        String name = str(req.get("name"));
        if (name != null && !name.isBlank()) item.setName(name.trim());
        Integer price = intOf(req.get("price"));
        if (price != null && price > 0) item.setPrice(price);
        Integer stock = intOf(req.get("stock"));
        if (stock != null && stock >= 0) item.setStock(stock);
        String unit = str(req.get("unit"));
        if (unit != null) item.setUnit(unit.trim());
        return ResponseEntity.ok(canteenItemRepository.save(item));
    }

    /** Bán N đơn vị: trừ tồn kho, cộng số đã bán trong ngày. */
    @PostMapping("/items/{id}/sell")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Transactional
    public ResponseEntity<?> sellItem(@PathVariable Long id,
                                      @RequestBody(required = false) Map<String, Object> req,
                                      @AuthenticationPrincipal User me) {
        CanteenItem item = canteenItemRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy món này."));
        }
        if (!canManage(item, me)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền bán món của cụm sân này."));
        }
        Integer qty = intOf(req == null ? null : req.get("qty"));
        if (qty == null || qty <= 0) qty = 1;
        if (item.getStock() != null && item.getStock() < qty) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Tồn kho không đủ (còn " + item.getStock() + ")."));
        }
        // Reset số đã bán khi sang ngày mới
        LocalDate today = LocalDate.now();
        if (item.getSoldDate() == null || !item.getSoldDate().toLocalDate().equals(today)) {
            item.setSoldDate(LocalDateTime.now());
            item.setSoldToday(0);
        }
        item.setStock((item.getStock() == null ? 0 : item.getStock()) - qty);
        item.setSoldToday((item.getSoldToday() == null ? 0 : item.getSoldToday()) + qty);
        return ResponseEntity.ok(canteenItemRepository.save(item));
    }

    /** Xoá một món. */
    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteItem(@PathVariable Long id, @AuthenticationPrincipal User me) {
        CanteenItem item = canteenItemRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy món này."));
        }
        if (!canManage(item, me)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền xoá món của cụm sân này."));
        }
        canteenItemRepository.delete(item);
        return ResponseEntity.ok(Map.of("message", "Đã xoá món.", "id", id));
    }

    private boolean canManage(CanteenItem item, User me) {
        if (me == null) return false;
        if ("ADMIN".equals(me.getRole().name())) return true;
        return item.getOwnerId() != null && item.getOwnerId().equals(me.getId());
    }

    private static String str(Object raw) {
        if (raw == null) return null;
        String s = String.valueOf(raw).trim();
        return s.isEmpty() ? null : s;
    }

    private static Integer intOf(Object raw) {
        if (raw == null) return null;
        try {
            return (int) Math.round(Double.parseDouble(String.valueOf(raw).trim()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Long longOf(Object raw) {
        if (raw == null) return null;
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
