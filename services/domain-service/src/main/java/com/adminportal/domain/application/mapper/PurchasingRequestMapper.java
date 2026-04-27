package com.adminportal.domain.application.mapper;

import com.adminportal.domain.application.dto.PurchasingRequestDto;
import com.adminportal.domain.domain.entity.PurchaseItem;
import com.adminportal.domain.domain.entity.PurchasingRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper – PurchasingRequest entity ⇄ DTO.
 * Rule 3: MapStruct ONLY, no ModelMapper.
 */
@Mapper(componentModel = "spring")
public interface PurchasingRequestMapper {

    @Mapping(target = "status", expression = "java(entity.getStatus().name())")
    PurchasingRequestDto toDto(PurchasingRequest entity);

    PurchasingRequestDto.PurchaseItemResponseDto toItemDto(PurchaseItem item);

    List<PurchasingRequestDto.PurchaseItemResponseDto> toItemDtoList(List<PurchaseItem> items);
}
