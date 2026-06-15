package com.nayepankh.volunteerhub.dto.volunteer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlyStatsResponse {
    private long eventsThisMonth;
}
