import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import LotView from './LotView'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lot/:lotNumber" element={<LotView />} />
      </Routes>
    </Router>
  )
}

export default App
