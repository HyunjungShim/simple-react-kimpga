import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    name: string;
    colors: {
      cardBgColor: string;
      secondary: string;
      text?: string;
      bgColor?: string;
      borderColor?: string;
      buttonBgColor?: string;
      borderBottomColor?: string;
      greenColor?: string;
      greenTextColor?: string;
      redColor?: string;
      yellowColor?: string;
      inputBorderColor?: string;
      selectActiveColor?: string;
    };
  }
} 