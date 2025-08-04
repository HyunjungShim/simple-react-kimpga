import { log } from "console";
import { createContext, useCallback, useLayoutEffect, useState } from "react";

export const ThemeContext = createContext<{
  theme: string;
  onChangeTheme: () => void;
}>({
  theme: "light",
  onChangeTheme: () => {},
});

export default function ThemeProviderWithState({ children }: { children: React.ReactNode }) {
  // 초기 theme을 즉시 결정하여 불필요한 리렌더링 방지
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && ["dark", "light"].includes(savedTheme)) {
      return savedTheme;
    }
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const onChangeTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      console.log('theme', newTheme);
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, onChangeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}