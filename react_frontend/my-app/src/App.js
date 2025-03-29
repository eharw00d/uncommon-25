import logo from './logo.svg';
import './App.css';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Account from './Pages/Account';
import NavBar from './Components/NavBar/NavBar';
import Login from './Pages/Login';
import Camera from './Pages/Camera';
import PixelPose from './Pages/PixelPose';

function App() {
  return (
    <BrowserRouter>
    <NavBar/>
    <Routes>
      <Route path='/' element={<Account/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/camera' element={<Camera/>}></Route>
      <Route path='/create' element={<PixelPose/>}></Route>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
