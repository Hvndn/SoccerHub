package com.turfzone.dto;

import lombok.Data;

/**
 * Thống kê chi tiết của một trận đấu (thẻ, thay người, MVP...).
 * Dùng để mở rộng MatchResult mà không phải sửa toàn bộ controller.
 */
@Data
public class MatchStatsRequest {
    private Integer yellowCardsA;
    private Integer yellowCardsB;
    private Integer redCardsA;
    private Integer redCardsB;
    private Integer substitutionsA;
    private Integer substitutionsB;
    private String mvpPlayer;
    private String notes;
}