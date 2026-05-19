import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Hello } from './routes/Hello';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
