import styled from "styled-components";
import { FlexBox } from "./CommonStyle";

export const HeaderWrapper = styled(FlexBox)`
    position: sticky;
    top: 0;
    z-index: 99;
    justify-content: space-between;
    padding: 10px 20px;
    background-color: ${({ theme }) => theme.colors.cardBgColor};
    margin-bottom: 10px;
    h1 {
        margin: 0;
        cursor: pointer;
        font-size: 25px;
    }
    @media screen and (max-width: 768px) {
        h1 {
            font-size: 20px;
        }
        flex-direction: column;
        gap: 5px;
    }
`;