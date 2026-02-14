import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: '',
          style: {
            border: '1px solid #713200',
            padding: '16px',
            color: '#713200',
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
    </>
  );
}

export default App;
