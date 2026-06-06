import React from 'react';

const EmptyPage = ({ title }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.text}>
          “your centralized system for full control and management.”
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: '70vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    maxWidth: '600px',
    background: '#fff',
    padding: '40px 30px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    textAlign: 'center',
    border: '1px solid #eee',
  },
  title: {
    fontSize: '26px',
    color: '#1f2937',
    marginBottom: '15px',
    fontWeight: '600',
  },
  text: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
};

export default EmptyPage;