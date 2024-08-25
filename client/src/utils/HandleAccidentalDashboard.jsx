import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './../assets/styles/HandleAccidentalDashboard.css';

const handleAccidentalDashboard = (messages, isConnected, hasPartner, navigate) => {
  if (messages.length > 0 && isConnected && hasPartner) {
    toast.warn(
      ({ closeToast }) => (
        <div className="toast-container">
          <p className="toast-message">Are you sure you want to leave the chat? Your chat will be lost!</p>
          <div className="toast-buttons">
            <button
              className="toast-button cancel"
              onClick={() => {
                closeToast();
                // Cancel navigation
              }}
            >
              Cancel
            </button>
            <button
              className="toast-button proceed"
              onClick={() => {
                closeToast();
                navigate('/dashboard'); // Proceed to dashboard
              }}
            >
              Proceed
            </button>
          </div>
        </div>
      ),
      {
        position: 'top-center',
        autoClose: 4000, // Keep the toast open until an action is taken
        closeOnClick: false, // Disable default close on click
        draggable: false, // Disable drag to close
      }
    );
  } else {
    navigate('/dashboard');
  }
};

export default handleAccidentalDashboard;
