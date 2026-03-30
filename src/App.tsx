import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: 'dark:bg-zinc-900 dark:text-white dark:border-white/10',
          style: {
            border: '1px solid #e2e8f0',
            padding: '16px',
            color: '#1a202c',
          },
          success: {
            style: {
              background: '#F0FDF4', // green-50
              border: '1px solid #BBF7D0', // green-200
              color: '#15803D', // green-700
              padding: '16px',
            },
            iconTheme: {
              primary: '#15803D',
              secondary: '#FFFAEE',
            },
          },
          error: {
            style: {
              background: '#FEF2F2', // red-50
              border: '1px solid #FECACA', // red-200
              color: '#B91C1C', // red-700
              padding: '16px',
            },
            iconTheme: {
              primary: '#B91C1C',
              secondary: '#FFFAEE',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
