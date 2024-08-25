import React from 'react';
import { Typography, Paper } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import '../assets/styles/Message.css';

const MessageContainer = styled(Paper)(({ theme, from }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  minWidth: '20%',
  maxWidth: '60%', // Ensure max width so the text wraps within this limit
  alignSelf: from === 'me' ? 'flex-end' : from === 'partner' ? 'flex-start' : 'center',
  backgroundColor: from === 'me' ? theme.palette.primary.main : from === 'partner' ? theme.palette.grey[200] : theme.palette.warning.light,
  textAlign: from === 'me' ? 'right' : 'left',
  borderRadius: from === 'me' ? '15px 15px 0px 15px' : '15px 15px 15px 0px',
  boxShadow: theme.shadows[1],
  color: from === 'me' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  position: 'relative',
  wordWrap: 'break-word', // Ensure long words are broken and wrapped within the container
  marginInlineEnd: from === 'me' ? theme.spacing(1) : 0,  // Add margin-inline-end for 'me'
  marginInlineStart: from === 'partner' ? theme.spacing(1) : 0,  // Add margin-inline-start for 'partner'
}));


const TimeStamp = styled(Typography)(({ theme, from }) => ({
  font: 'small-caption',
  position: 'absolute',
  bottom: theme.spacing(0.5),
  left: from === 'me' ? theme.spacing(0.5) : 'auto',
  right: from !== 'me' ? theme.spacing(0.5) : 'auto',
  fontSize: '0.65rem', // Smaller font size
  fontWeight: 300, // Slimmer font
  color: theme.palette.text.secondary,
}));

const Message = ({ message }) => {
  const theme = useTheme();
  return (
    <MessageContainer theme={theme} from={message.from}>
      <Typography
        variant="body1"
        component="p"
        className={`message-box ${message.from === 'me' ? 'me' : 'partner'}`}
      >
        {message.body}
      </Typography>
      <TimeStamp variant="caption" from={message.from}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
      </TimeStamp>
    </MessageContainer>
  );
};

export default Message;
