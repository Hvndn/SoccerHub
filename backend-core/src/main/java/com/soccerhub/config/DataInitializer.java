package com.soccerhub.config;

import com.soccerhub.model.Pitch;
import com.soccerhub.model.User;
import com.soccerhub.model.UserRole;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PitchRepository pitchRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("System initialized with clean database - ready for real data.");
    }
}
