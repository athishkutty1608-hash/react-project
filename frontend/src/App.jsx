import{ BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer'


function App () {
  return(
<>
    <BrowserRouter>
    <div className='min-h-screen flex flex-col'>
    <Navbar/>
    <main className='flex-1'>
    <Routes>
      <Route path='/'element={<Home/>}/>
      <Route path='/About' element={<About/>}/>
      <Route path='/Contact' element={<Contact/>}/>
      <Route path='/Login' element={<Login/>}/>
    </Routes>
    </main>
    <Footer/>
    </div>
    </BrowserRouter>
</>
  );
}

export default App;