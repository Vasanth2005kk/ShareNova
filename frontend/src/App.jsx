import { createBrowserRouter, Outlet } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import HomePage from '@/pages/Home';
import StartPage from '@/pages/Start';
import RetrievePage from '@/pages/Retrieve';
import AboutPage from '@/pages/About';

function RootLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
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
      { path: '/about', element: <AboutPage /> },
      { path: '/start', element: <StartPage /> },
      { path: '/upload', element: <StartPage /> },
      { path: '/text', element: <StartPage /> },
      { path: '/retrieve', element: <RetrievePage /> },
    ],
  },
]);
