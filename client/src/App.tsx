import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './assets/styles/theme';
import Header from './components/Header';
import ThemeProviderWithState, { ThemeContext } from './contexts/ThemeProviderWithState';

import { Outlet } from 'react-router-dom';
import { Container } from './assets/styles/common/CommonStyle';
import GlobalStyles from './assets/styles/GlobalStyles';
import KimpProvider from './contexts/KimpContext';
import { useContext } from 'react';

// AppContent는 Provider 내부에서만 사용!
function AppContent() {
  const { theme } = useContext(ThemeContext);
  return (
    <>
      <ThemeProvider theme={theme === "dark" ? darkTheme : lightTheme}>
        <KimpProvider>
          <GlobalStyles />
          <Container>
            <Header />
            <Outlet />
          </Container>
        </KimpProvider>
      </ThemeProvider>
    </>
  );
}

export default function App() {
  return (
    <ThemeProviderWithState>
      <AppContent />
    </ThemeProviderWithState>
  );
}
