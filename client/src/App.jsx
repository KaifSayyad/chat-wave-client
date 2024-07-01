import { useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import ChatPage from './components/ChatPage'



function App() {

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={ <Home/> } />
        <Route path="/chat" element={ <ChatPage/> } />
      </Routes>
    </div>
  )
}

export default App
