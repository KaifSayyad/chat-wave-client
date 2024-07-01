import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated import
import { BrowserRouter } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#5d98f5',
      light: '#63a4ff',
    },
    secondary: {
      main: '#f50057',
    },
    warning: {
      main: '#ffea00',  // Changed from light to main
    },
  },
});

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container); // Create a root

root.render(
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);
