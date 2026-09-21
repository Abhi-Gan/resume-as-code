import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './app/App.tsx'
import { PrintRoute } from './app/routes/PrintRoute.tsx'
import { FileOpenRoute } from './app/routes/FileOpenRoute.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/print" element={<PrintRoute />} />
      <Route path="/open/:name" element={<FileOpenRoute />} />
    </Routes>
  </BrowserRouter>,
)
