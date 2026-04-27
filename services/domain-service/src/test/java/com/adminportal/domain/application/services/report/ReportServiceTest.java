package com.adminportal.domain.application.services.report;

import com.adminportal.domain.domain.entity.PurchaseItem;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import com.adminportal.domain.domain.repository.PurchasingRequestRepository;
import com.adminportal.domain.infrastructure.jasper.JasperReportCompiler;
import com.adminportal.domain.infrastructure.jasper.JasperReportException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("ReportService Tests")
class ReportServiceTest {

    private PurchasingRequestRepository requestRepository;
    private JasperReportCompiler jasperReportCompiler;
    private ReportService reportService;

    private PurchasingRequest requestOne;
    private PurchasingRequest requestTwo;
    private Map<Long, PurchasingRequest> requestStore;
    private List<PurchasingRequest> allRequests;

    @BeforeEach
    void setUp() {
        jasperReportCompiler = new JasperReportCompiler();
        reportService = new ReportService();

        requestOne = PurchasingRequest.create(
            "YC-2026-001",
            "Mua máy tính",
            "Yêu cầu mua 2 máy tính",
            "alice",
            1L,
            "CC-01",
            "VND"
        );
        requestOne.addItem(PurchaseItem.create("IT-01", "Laptop Dell", 2, new BigDecimal("25000000"), "Core i7, RAM 16GB"));
        requestOne.submit();

        requestTwo = PurchasingRequest.create(
            "YC-2026-002",
            "Mua máy in",
            "Yêu cầu mua 1 máy in",
            "bob",
            2L,
            "CC-02",
            "VND"
        );
        requestTwo.addItem(PurchaseItem.create("PR-01", "Printer HP", 1, new BigDecimal("8000000"), "Laser, A4"));
        requestTwo.submit();

        requestStore = new HashMap<>();
        requestStore.put(1L, requestOne);
        requestStore.put(2L, requestTwo);
        allRequests = List.of(requestOne, requestTwo);

        requestRepository = createRepositoryStub();
        ReflectionTestUtils.setField(reportService, "requestRepository", requestRepository);
        ReflectionTestUtils.setField(reportService, "jasperReportCompiler", jasperReportCompiler);
    }

    @Test
    @DisplayName("Should generate requests by status PDF")
    void exportRequestsByStatus_shouldGeneratePdf() {
        byte[] pdf = assertDoesNotThrow(() -> reportService.exportRequestsByStatus("PENDING", "report.user"));

        assertNotNull(pdf);
        assertPdfHeader(pdf);
    }

    @Test
    @DisplayName("Should generate request detail PDF")
    void exportRequestDetail_shouldGeneratePdf() {
        byte[] pdf = assertDoesNotThrow(() -> reportService.exportRequestDetail(1L, "report.user"));

        assertNotNull(pdf);
        assertPdfHeader(pdf);
    }

    @Test
    @DisplayName("Should throw JasperReportException when request not found")
    void exportRequestDetail_shouldThrowWhenRequestNotFound() {
        assertThrows(JasperReportException.class, () -> reportService.exportRequestDetail(99L, "report.user"));
    }

    @Test
    @DisplayName("Should generate financial summary PDF")
    void exportFinancialSummary_shouldGeneratePdf() {
        byte[] pdf = assertDoesNotThrow(() -> reportService.exportFinancialSummary(
            LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 12, 31),
            "report.user"
        ));

        assertNotNull(pdf);
        assertPdfHeader(pdf);
    }

    @Test
    @DisplayName("Should reject invalid report status")
    void exportRequestsByStatus_shouldRejectInvalidStatus() {
        assertThrows(RuntimeException.class, () -> reportService.exportRequestsByStatus("INVALID", "report.user"));
    }

    private PurchasingRequestRepository createRepositoryStub() {
        InvocationHandler handler = new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) {
                return switch (method.getName()) {
                    case "findAll" -> allRequests;
                    case "findById" -> Optional.ofNullable(requestStore.get((Long) args[0]));
                    default -> defaultReturnValue(method.getReturnType());
                };
            }
        };

        return (PurchasingRequestRepository) Proxy.newProxyInstance(
            PurchasingRequestRepository.class.getClassLoader(),
            new Class<?>[] { PurchasingRequestRepository.class },
            handler
        );
    }

    private Object defaultReturnValue(Class<?> returnType) {
        if (!returnType.isPrimitive()) {
            return null;
        }
        if (returnType == boolean.class) {
            return false;
        }
        if (returnType == byte.class) {
            return (byte) 0;
        }
        if (returnType == short.class) {
            return (short) 0;
        }
        if (returnType == int.class) {
            return 0;
        }
        if (returnType == long.class) {
            return 0L;
        }
        if (returnType == float.class) {
            return 0f;
        }
        if (returnType == double.class) {
            return 0d;
        }
        if (returnType == char.class) {
            return '\0';
        }
        return null;
    }

    private void assertPdfHeader(byte[] pdf) {
        assertArrayEquals(new byte[] {'%', 'P', 'D', 'F'}, new byte[] {pdf[0], pdf[1], pdf[2], pdf[3]});
    }
}
