/**
 * App Component - Main application with routing
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ComponentDemo from './components/ComponentDemo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<ComponentDemo />} />
      </Routes>
    </Router>
  );
}

export default App;