package com.turfzone.repository;

import com.turfzone.model.BookingAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookingAttendanceRepository extends JpaRepository<BookingAttendance, Long> {
    List<BookingAttendance> findByBookingIdOrderByVotedAtAsc(Long bookingId);
    Optional<BookingAttendance> findByBookingIdAndPlayerName(Long bookingId, String playerName);
    void deleteByBookingIdAndPlayerName(Long bookingId, String playerName);
    void deleteByBookingId(Long bookingId);
}
