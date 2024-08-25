import React from 'react';
import { toast } from 'react-toastify';
import Button from '@mui/material/Button';
import '../assets/styles/SaveRequest.css';

const SaveRequest = ({ onAccept, onReject }) => {
  const handleAccept = () => {
    onAccept();
    toast.dismiss(); // Close the toast after accepting
  };

  const handleReject = () => {
    onReject();
    toast.dismiss(); // Close the toast after rejecting
  };

  const CustomToast = ({ closeToast }) => (
    <div className="save-request-toast">
      <p>Your partner wants to save the chat. Do you want to save the chat?</p>
      <div className="save-request-buttons">
        <Button
          variant="contained"
          color="primary"
          onClick={handleAccept}
          style={{ marginRight: '10px', backgroundColor: '#4CAF50' }}
        >
          Accept
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleReject}
          style={{ backgroundColor: '#F44336' }}
        >
          Reject
        </Button>
      </div>
    </div>
  );

  // Trigger the custom toast when the component is used
  toast(<CustomToast />, {
    position: 'top-center',
    autoClose: false, // Don't automatically close
    closeOnClick: false,
    draggable: false,
    hideProgressBar: true,
  });

  return null; // This component doesn't need to render anything directly
};

export default SaveRequest;
