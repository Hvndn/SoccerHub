package com.turfzone.repository;

import com.turfzone.model.BookingWaitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingWaitlistRepository extends JpaRepository<BookingWaitlist, Long> {

    List<BookingWaitlist> findByPitchIdAndCourtNameAndBookingDateAndTimeSlotAndStatus(
            Long pitchId, String courtName, String bookingDate, String timeSlot, String status
    );

    List<BookingWaitlist> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);

    List<BookingWaitlist> findByPitchIdOrderByCreatedAtDesc(Long pitchId);

    Optional<BookingWaitlist> findByPitchIdAndCourtNameAndBookingDateAndTimeSlotAndCustomerEmailAndStatus(
            Long pitchId, String courtName, String bookingDate, String timeSlot, String customerEmail, String status
    );
}
