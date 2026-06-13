package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.dto.auth.AuthResponse;
import com.nayepankh.volunteerhub.dto.auth.LoginRequest;
import com.nayepankh.volunteerhub.dto.auth.RegisterRequest;
import com.nayepankh.volunteerhub.entity.User;
import com.nayepankh.volunteerhub.entity.VolunteerProfile;
import com.nayepankh.volunteerhub.enums.Role;
import com.nayepankh.volunteerhub.exception.BadRequestException;
import com.nayepankh.volunteerhub.repository.UserRepository;
import com.nayepankh.volunteerhub.repository.VolunteerProfileRepository;
import com.nayepankh.volunteerhub.security.JwtUtil;
import com.nayepankh.volunteerhub.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VolunteerProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;
    private final AuditLogService auditLogService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role role = req.getRole() != null ? req.getRole() : Role.ROLE_VOLUNTEER;

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .build();
        user = userRepository.save(user);

        if (role == Role.ROLE_VOLUNTEER) {
            VolunteerProfile profile = VolunteerProfile.builder().user(user).build();
            profileRepository.save(profile);
        }

        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateToken(details, user.getRole().name(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(details);

        auditLogService.log(user.getId(), "USER_REGISTERED", "New user: " + user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        User user = userRepository.findByEmail(req.getEmail()).orElseThrow();
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateToken(details, user.getRole().name(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(details);

        auditLogService.log(user.getId(), "USER_LOGIN", "Login: " + user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse refresh(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email).orElseThrow();
        UserDetails details = userDetailsService.loadUserByUsername(email);
        String newAccess = jwtUtil.generateToken(details, user.getRole().name(), user.getId());
        return AuthResponse.builder()
                .accessToken(newAccess)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
