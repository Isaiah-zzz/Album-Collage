import logo from './logo.svg';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import {Collage} from './component/collage.jsx'
import { MakeCollage } from './component/MakeCollage.jsx';


function App() {
  return (
    // <div>
    //   <Collage></Collage>
    // </div>
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Collage />} />
          <Route path= "/make" element = {<MakeCollage></MakeCollage>}></Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
