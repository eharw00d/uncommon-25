import logo from './logo.svg';
import './App.css';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Account from './Pages/Account';
import NavBar from './Components/NavBar/NavBar';
import Login from './Pages/Login';
import Camera from './Pages/Camera';
import PixelPose from './Pages/PixelPose';
import CursorPixels from './Components/CursorPixels/CursorPixels';
import UserProfile from './Pages/Usertest';
import FriendManagement from './Pages/Friendtest';
import SimpleFriendAdd from './Pages/Friendtest';
import Grid from './Pages/Grid/Grid';

function App() {
  return (
    <>
    <CursorPixels />
    <BrowserRouter>
    <NavBar/>
    <Routes>
      <Route path='/' element={<Account/>}/>
      <Route path='/addname' element={<UserProfile/>}/>
      <Route path='/addfriend' element={<FriendManagement/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/camera' element={<Camera/>}></Route>
      <Route path='/create' element={<PixelPose/>}></Route>
      <Route path='/grid' element={<Grid />} /> 
    </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
