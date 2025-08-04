import { Button, FlexBox, TitleIcon } from "../assets/styles/common/CommonStyle";
import { HeaderWrapper } from "../assets/styles/common/Header";
import { useNavigate } from "react-router-dom";
import { MoonFilled, SettingOutlined, SunFilled } from "@ant-design/icons";
import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeProviderWithState";
export default function Header() {
  const navigate = useNavigate();
  const { theme, onChangeTheme } = useContext(ThemeContext);
  return (
    <HeaderWrapper>
      <FlexBox gap="10px">
        <h1 onClick={() => navigate('/')}>김프알림</h1>
        <TitleIcon src={process.env.PUBLIC_URL + "/assets/images/alarm-icon.png"} alt="alarm-icon" />
      </FlexBox>
      <FlexBox gap="10px">
        <Button onClick={() => navigate('/setting')}>
          <span>사용자 설정 <SettingOutlined /></span>
        </Button>
        <Button
          onClick={onChangeTheme}
          className="min-width"
        >
          {theme === 'dark' ?
            <FlexBox gap="5px">
              <MoonFilled style={{color: "#ffe310"}}/>  다크모드
            </FlexBox>
            :
            <FlexBox gap="5px">
              <SunFilled style={{color: "#ff9705"}}/> 라이트모드
            </FlexBox>}
        </Button>
      </FlexBox>
    </HeaderWrapper>
  )
}