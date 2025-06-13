import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

function ProfileEdit() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: ''
  });
  
  const [originalData, setOriginalData] = useState({}); // Store original values
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await fetch('http://localhost:8000/api/users/me/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const userData = await response.json();
        // Set original data for comparison later
        setOriginalData(userData);
        
        // Set the form data with user data
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          username: userData.username || ''
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast.error('Could not load your profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Only include fields that have changed and are not empty
      const changedData = {};
      
      if (formData.first_name !== originalData.first_name && formData.first_name !== '') {
        changedData.first_name = formData.first_name;
      }
      
      if (formData.last_name !== originalData.last_name && formData.last_name !== '') {
        changedData.last_name = formData.last_name;
      }
      
      if (formData.username !== originalData.username && formData.username !== '') {
        changedData.username = formData.username;
      }
      
      // If no fields were changed, don't make the request
      if (Object.keys(changedData).length === 0) {
        showToast.info('No changes were made');
        navigate('/profile');
        return;
      }
      
      console.log("Sending profile update data:", changedData);
      
      const response = await fetch('http://localhost:8000/api/users/me/', {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changedData)  // Only send changed fields
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedData = await response.json();
      
      // Update localStorage with new user data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showToast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder={originalData.first_name || 'Enter first name'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder={originalData.last_name || 'Enter last name'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder={originalData.username || 'Enter username'}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfileEdit;