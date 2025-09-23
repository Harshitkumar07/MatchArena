import React, { useState } from 'react';
import { auth } from '../services/firebase/firebaseClient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const FirebaseTest = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSignUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setResult(`Success! User created: ${userCredential.user.email}`);
    } catch (error) {
      setResult(`Error: ${error.code} - ${error.message}`);
      console.error('Full error:', error);
    }
    setLoading(false);
  };

  const testSignIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setResult(`Success! Signed in as: ${userCredential.user.email}`);
    } catch (error) {
      setResult(`Error: ${error.code} - ${error.message}`);
      console.error('Full error:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>Firebase Authentication Test</h3>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ margin: '5px', padding: '5px' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ margin: '5px', padding: '5px' }}
        />
      </div>
      <div>
        <button onClick={testSignUp} disabled={loading} style={{ margin: '5px' }}>
          Test Sign Up
        </button>
        <button onClick={testSignIn} disabled={loading} style={{ margin: '5px' }}>
          Test Sign In
        </button>
      </div>
      {result && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: result.includes('Success') ? '#d4edda' : '#f8d7da',
          borderRadius: '4px' 
        }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;