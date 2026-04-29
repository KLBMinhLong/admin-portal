package com.adminportal.auth.infrastructure.web.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TraceFilterTest {

    @Test
    void testTraceFilterCreatesNewTraceId() throws Exception {
        TraceFilter filter = new TraceFilter();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        assertNotNull(response.getHeader("X-Trace-Id"));
        verify(filterChain, times(1)).doFilter(request, response);
    }
    
    @Test
    void testTraceFilterUsesExistingTraceId() throws Exception {
        TraceFilter filter = new TraceFilter();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Trace-Id", "existing-trace-id");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        assertEquals("existing-trace-id", response.getHeader("X-Trace-Id"));
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
