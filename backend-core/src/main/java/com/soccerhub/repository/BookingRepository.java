package com.soccerhub.repository;

import com.soccerhub.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPitchId(Long pitchId);
    List<Booking> findByPitchIdAndBookingDate(Long pitchId, String bookingDate);
    Optional<Booking> findByCode(String code);
    Optional<Booking> findByCustomerPhone(String customerPhone);
    List<Booking> findByCustomerPhoneContaining(String customerPhone);
    Optional<Booking> findByPitchIdAndCourtNameAndBookingDateAndTimeSlot(Long pitchId, String courtName, String bookingDate, String timeSlot);
}
