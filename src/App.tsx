import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './contexts/SettingsContext';
import SettingsPage from './pages/SettingsPage';
import { CircularProgress, Box } from '@mui/material';


import MainLayout from './components/layout/MainLayout';
import HeadlineList from './components/HeadlineList';


const MainPage = () => (
  <MainLayout>
    <HeadlineList />
  </MainLayout>
);

const App = () => {
  const { settings, isInitialized } = useSettings();

  if (!isInitialized) {
    // Show a loading spinner while settings are being loaded from localStorage
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={settings ? <MainPage /> : <Navigate to="/settings" replace />}
      />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
};

export default App;
