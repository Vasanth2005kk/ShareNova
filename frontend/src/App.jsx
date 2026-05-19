import { createBrowserRouter, Outlet } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import HomePage from '@/pages/Home';
import TextPage from '@/pages/Text';

function RootLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/text', element: <TextPage /> },
      { path: '/text/:sessionId', element: <TextPage /> },
    ],
  },
]);
