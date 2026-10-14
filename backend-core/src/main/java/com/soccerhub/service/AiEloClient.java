package com.soccerhub.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Gọi AI service tính Elo sau mỗi trận. Nếu AI offline thì fallback
 * công thức Elo chuẩn (K=32) ngay trong backend để demo không gãy.
 */
@Service
@Slf4j
public class AiEloClient {

    @Value("${ai-service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public Map<String, Double> calculateElo(int ratingA, int ratingB, int scoreA, int scoreB) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(4000);
            factory.setReadTimeout(4000);
            RestTemplate rest = new RestTemplate(factory);

            Map<String, Object> req = new LinkedHashMap<>();
            req.put("rating_a", (double) ratingA);
            req.put("rating_b", (double) ratingB);
            req.put("score_a", scoreA);
            req.put("score_b", scoreB);

            @SuppressWarnings("unchecked")
            Map<String, Object> res = rest.postForObject(
                    aiServiceUrl + "/api/v1/ai/calculate-elo", req, Map.class);
            @SuppressWarnings("unchecked")
            Map<String, Object> elo = (Map<String, Object>) res.get("elo_result");
            Map<String, Double> out = new LinkedHashMap<>();
            out.put("newA", ((Number) elo.get("new_rating_a")).doubleValue());
            out.put("newB", ((Number) elo.get("new_rating_b")).doubleValue());
            out.put("deltaA", ((Number) elo.get("delta_a")).doubleValue());
            out.put("deltaB", ((Number) elo.get("delta_b")).doubleValue());
            out.put("aiOnline", 1.0);
            return out;
        } catch (Exception e) {
            log.warn("AI service unreachable ({}), fallback local Elo", e.getMessage());
            double ea = 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400.0));
            double eb = 1.0 - ea;
            double actualA = scoreA > scoreB ? 1.0 : scoreA < scoreB ? 0.0 : 0.5;
            double actualB = 1.0 - actualA;
            double newA = ratingA + 32 * (actualA - ea);
            double newB = ratingB + 32 * (actualB - eb);
            Map<String, Double> out = new LinkedHashMap<>();
            out.put("newA", Math.round(newA * 10) / 10.0);
            out.put("newB", Math.round(newB * 10) / 10.0);
            out.put("deltaA", Math.round((newA - ratingA) * 10) / 10.0);
            out.put("deltaB", Math.round((newB - ratingB) * 10) / 10.0);
            out.put("aiOnline", 0.0);
            return out;
        }
    }
}
