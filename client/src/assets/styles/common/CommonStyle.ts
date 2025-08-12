import styled from "styled-components";

export const Container = styled.div`
  padding: 20px;
  max-width: 80vw;
  margin: 0 auto;
  @media screen and (max-width: 768px) {
    max-width: 95vw;
  }
`;

export const Card = styled.div`
    background: ${({ theme }) => theme.colors.cardBgColor};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    &.modal-card {
      min-width: 500px;
      h3 {
        position: relative;
        .close-button {
          position: absolute;
          top: 0px;
          right: 0px;
          font-size: 18px;
          cursor: pointer;
        }
      }
    }
    @media screen and (max-width: 768px) {
      &.modal-card {
        min-width: 85%;
        padding: 10px;
      }
    }
`;

export const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 15px;
`;
export const TitleIcon = styled.img<{ width?: string }>`
  width: ${({ width }) => width || '35px'};
`;
export const Status = styled.div<{ status: string }>`
    padding: 8px 12px;
    border-radius: 4px;
    margin: 15px 0;
    font-weight: 500;
    
    ${({ status, theme }) => {
    switch (status) {
      case 'granted':
        return 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
      case 'denied':
        return 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
      case 'default':
        return 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;';
      default:
        return 'background: #e2e3e5; color: #383d41; border: 1px solid #d6d8db;';
    }
  }}
`;

export const Button = styled.button`
  background: ${({ theme }) => theme.colors.buttonBgColor};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  &.center {
    display:block;
    margin: 20px auto 0;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.buttonBgColor};
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  &.min-width {
    min-width:130px;
  }
  @media screen and (max-width: 768px) {
    padding: 10px 15px;
  }
`;
export const DangerButton = styled(Button)`
  background: ${({ theme }) => theme.colors.redColor};
  font-weight: 500;
  &:hover {
    background: ${({ theme }) => theme.colors.redColor};
  }
`;

export const SuccessButton = styled(Button)`
  background: ${({ theme }) => theme.colors.greenColor};
  color: ${({ theme }) => theme.colors.greenTextColor};
  font-weight: 500;
  &:hover {
    background: ${({ theme }) => theme.colors.greenColor};
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.inputBorderColor};
  border-radius: 4px;
  margin-bottom: 10px;
  background: ${({ theme }) => theme.colors.bgColor};
  color: ${({ theme }) => theme.colors.text};
`;

export const CustomInput = styled(Input)`
  padding: 8px 12px;
  width: 300px;
  max-width: 90%;
  margin-left: auto;
  margin-bottom: 0;
  @media screen and (max-width: 768px) {
    width: 200px;
  }
`;

export const ClearButton = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  min-height: 80px;
  resize: vertical;
`;

export const FlexBox = styled.div<{ justifycontent?: string, alignitems?: string, flexdirection?: string, gap?: string, padding?: string , flexwrap?: string }>`
  display:flex;
  align-items: ${({ alignitems }) => alignitems || 'center'};
  justify-content: ${({ justifycontent }) => justifycontent || 'center'};
  flex-direction: ${({ flexdirection }) => flexdirection || 'row'};
  gap: ${({ gap }) => gap || '0'};
  padding: ${({ padding }) => padding || '0'};
  flex-wrap: ${({ flexwrap }) => flexwrap || 'nowrap'};
  &.w-100 > * {
    width: 100%;
  }
  &.price-wrapper {
    padding-left: 10px;
  }
`;

export const ModalLayout = styled(FlexBox)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
`;

export const ListContainer = styled.div<{ minheight?: string }>`
  width: 100%;
  min-height: ${({ minheight }) => minheight || '300px'};
`;