import React, { useState } from 'react';

interface FormData {
  username: string;
  password: string;
}

export default function Login() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Submitted Data:', formData);
  };

  return (
    <div className="container">
      <h1 className="login-header">NZ Animal Sightings Dashboard</h1>
      <div className="login-box">
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <div className="form-group">
            <label htmlFor="username">Username: </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password: </label>
            <input
              name="password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary btn-block">
              <span>Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
