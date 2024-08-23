import React from 'react'
import '../assets/styles/Dashboard.css'
import Navbar from '../utils/Navbar'


//To add search bar in saved-chats component and render messages based on chat id

const Dashboard = () => {
  return (
    <>
    <Navbar />
      <div className="dashboard-container">
        <div className="saved-chats">

        </div>
        <div className="chat-area">

        </div>
      </div>      
    </>
  )
}

export default Dashboard