import styled from "styled-components";
import { FlexBox } from "../common/CommonStyle";

export const KimpStatus = styled.div`
  background: ${({ theme }) => theme.colors.cardBgColor};
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
`;

export const KimpStatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const KimpStatusItem = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  grid-template-columns: minmax(auto, 1fr) 1fr 1fr 1fr;
  text-align: center;
  margin:5px 0;
  min-height: 40px;
  padding: 5px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderBottomColor};
  &.header-item {
    margin-top: 20px;
    p:nth-child(1) {
      text-align: left;
    }
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  }
  &.edit-alarm-list {
    grid-template-columns: minmax(auto, 1fr) 1fr 1fr;
    button {
      width: 50%;
      margin-left:auto;
    }
  }
  &.setting-alarm-list {
    grid-template-columns: minmax(auto, 1fr) 1fr 1fr 1fr;
  }
  span {
    cursor: pointer;
  }
  @media screen and (max-width: 768px) {
    p,span {
      font-size: 14px;
    }
    &.header-item {
      p:nth-child(1) {
        text-align: center;
      }
    }
    &.setting-alarm-list {
      grid-template-columns: minmax(auto, 1fr) 1fr;
    }
    grid-template-columns: minmax(auto, 1fr) 1fr;
    gap:10px;
    /* *:nth-child(1) {
      grid-row:1;
      grid-column: 1 / 3;
    }
    *:nth-child(2) {
      grid-row:2;
    }
    *:nth-child(3) {
      grid-row:2;
    }
    *:nth-child(4) {
      grid-row:2;
    }
    *:nth-child(5) {
      grid-row:1;
      grid-column: 3 / 3;
    } */
    &:not(.edit-alarm-list):nth-child(1) {
      grid-row:1;
      grid-column: 1 / 1;
    }
    &:not(.edit-alarm-list):nth-child(2) {
      grid-row:2;
    }
    &:not(.edit-alarm-list):nth-child(3) {
      grid-row:2;
    }
    &:not(.edit-alarm-list):nth-child(4) {
      grid-row:1;
      grid-column: 2 / 2;
    }

  }
`;

export const SymbolContainer = styled(FlexBox)`
  gap: 10px;
  min-width: max-content;
  justify-content: flex-start;
  &.select-symbol {
    justify-content: flex-start;
  }
  img {
    width: 25px;
    border-radius: 50%;
  }
  @media screen and (max-width: 768px) {
    font-size: 13px;
    justify-content: center;
  }
`;