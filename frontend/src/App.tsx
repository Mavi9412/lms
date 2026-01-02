import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Add more routes here later */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
