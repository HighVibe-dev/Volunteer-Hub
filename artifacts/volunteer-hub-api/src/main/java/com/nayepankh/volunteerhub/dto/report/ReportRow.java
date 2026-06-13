package com.nayepankh.volunteerhub.dto.report;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ReportRow {
    private List<String> headers;
    private List<Map<String, String>> rows;
    private long totalCount;
}
