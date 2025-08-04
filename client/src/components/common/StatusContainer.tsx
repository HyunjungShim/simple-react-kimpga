import { FlexBox } from "../../assets/styles/common/CommonStyle";
import { getStatusText } from "../../utils/textFormatter";
import { useTheme } from "styled-components";

export default function StatusContainer({ status }: { status: string }) {
    const theme = useTheme();
    return (
        <FlexBox padding="20px 0">
            <p style={{color:theme.colors.text}}>{getStatusText(status)}</p>
        </FlexBox>
    )
}