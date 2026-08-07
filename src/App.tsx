import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GameShell } from '@/app/GameShell';
import { ContentCatalogPage } from '@/admin/ContentCatalogPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameShell />} />
        <Route path="/admin/catalog" element={<ContentCatalogPage />} />
      </Routes>
    </BrowserRouter>
  );
}
