import React from 'react';

const EmptyPage = ({ title }) => {
  return (
    <div style={{ textAlign: 'center'}}>
      <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>{title}</h2>
      <p style={{ fontSize: '16px', color: '#666' }}>Stay tuned. Something great is coming soon.</p>
    </div>
  );
};

export default EmptyPage;
