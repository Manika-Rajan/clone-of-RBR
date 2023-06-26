import './App.css';
import About from './components/About';
import Contact from './components/Contact';
import Navbar from './components/Navbar';
import Reports from './components/Reports';
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import ReportsDisplay from './components/ReportsDisplay';
import Payment from './components/Payment';
import Footer from './components/Footer'
import CommingSoon from './components/CommingSoon';
import Invalid from './components/Invalid';

function App() {
  return (
    <BrowserRouter>
    <div className="App">
         <Routes>
        <Route path="/about" element={<About/>} />
        <Route path="/" element={<Reports/>}/>
        <Route path='/contact' element={<Contact/>}/>
        <Route path='/report-display' element={<ReportsDisplay/>}/>
        <Route path='/payment' element={<Payment/>}/>
        <Route path='/commingSoon' element={<CommingSoon/>} />
        <Route path='/not-found' element={<Invalid/>} />
      </Routes>
      <Footer/>
    </div>
    </BrowserRouter>
  );
}

export default App;
