import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './routes/Home'
import { DemoPrReview } from './routes/DemoPrReview'
import { DemoThreatModel } from './routes/DemoThreatModel'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo/pr-review" element={<DemoPrReview />} />
        <Route path="/demo/threat-model" element={<DemoThreatModel />} />
      </Routes>
    </BrowserRouter>
  )
}
