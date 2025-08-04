import { DefaultTheme } from "styled-components";

const lightTheme: DefaultTheme = {
    name: "light",
    colors: {
        cardBgColor: "#ffffff",
        secondary: "#000000",
        text: "#333333",
        bgColor: "#f8f9fa",
        borderColor: "#dee2e6",
        borderBottomColor: "#f1f1f1c4",
        buttonBgColor: "#f8f9fa",
        greenColor:"#d4edda",
        greenTextColor:"#155724",
        redColor:"#ff5364",
        yellowColor:"#FFD84D",
        inputBorderColor:"#ccc",
        selectActiveColor:"#efefef"
    },
};

const darkTheme: DefaultTheme = {
    name: "dark",
    colors: {
        cardBgColor: "#2d2d2d",
        secondary: "#ffffff",
        text: "#ffffff",
        bgColor: "#1a1a1a",
        borderColor: "#424242",
        borderBottomColor: "#4b4b4bb0",
        buttonBgColor: "#000",
        greenColor:"#d4edda",
        greenTextColor:"#155724",
        redColor:"#dc3545", 
        yellowColor:"#FFD84D",
        inputBorderColor:"#8d8d8d",
        selectActiveColor:"#000"
    },
};

export { lightTheme, darkTheme };