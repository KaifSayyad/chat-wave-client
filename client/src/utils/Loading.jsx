import React from 'react'
import { Hourglass } from 'react-loader-spinner';

const Loading = () => {
  return (
    <div className='loading-container' style={loadingStyleSheet}>
        <h1>Loading...</h1>
        <Hourglass
            visible={true}
            height="80"
            width="80"
            ariaLabel="hourglass-loading"
            wrapperStyle={{}}
            wrapperClass=""
            colors={['#306cce', '#72a1ed']}
        />
    </div>
  )
}

const loadingStyleSheet = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    color: '#306cce',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    overflow: 'hidden',
}

export default Loading
