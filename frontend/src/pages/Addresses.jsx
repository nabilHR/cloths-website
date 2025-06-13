import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Addresses() {
  const [addresses, setAddresses] = useState([]);  // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    is_default: false
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/shipping-addresses/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAddresses(data);
        } else {
          setError('Failed to load addresses');
        }
      } catch (err) {
        setError('An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `http://localhost:8000/api/shipping-addresses/${editingId}/`
        : 'http://localhost:8000/api/shipping-addresses/';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (editingId) {
          setAddresses(prev => prev.map(addr => addr.id === editingId ? data : addr));
        } else {
          setAddresses(prev => [...prev, data]);
        }
        
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          address: '',
          city: '',
          postal_code: '',
          country: '',
          is_default: false
        });
        setShowForm(false);
        setEditingId(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save address');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Edit address
  const handleEdit = (address) => {
    setFormData({
      first_name: address.first_name,
      last_name: address.last_name,
      address: address.address,
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  // Delete address
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/shipping-addresses/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
      } else {
        setError('Failed to delete address');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  // Set address as default
  const setAsDefault = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const address = addresses.find(addr => addr.id === id);
      
      const response = await fetch(`http://localhost:8000/api/shipping-addresses/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ is_default: true })
      });

      if (response.ok) {
        // Update addresses list to reflect the new default
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_default: addr.id === id
        })));
      } else {
        setError('Failed to update default address');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Saved Addresses</h1>
        <p>Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Saved Addresses</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            if (!showForm) {
              setFormData({
                first_name: '',
                last_name: '',
                address: '',
                city: '',
                postal_code: '',
                country: '',
                is_default: false
              });
            }
          }}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Set as default shipping address</span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {Array.isArray(addresses) && addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(address => (
            <div key={address.id} className={`bg-white rounded-lg shadow-sm p-6 border-2 ${address.is_default ? 'border-black' : 'border-transparent'}`}>
              {address.is_default && (
                <div className="inline-block bg-black text-white text-xs px-2 py-1 rounded mb-2">
                  Default Address
                </div>
              )}
              <h3 className="font-medium text-lg">{address.first_name} {address.last_name}</h3>
              <p className="text-gray-600 mt-1">{address.address}</p>
              <p className="text-gray-600">{address.city}, {address.postal_code}</p>
              <p className="text-gray-600">{address.country}</p>
              
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {!address.is_default && (
                  <button
                    onClick={() => setAsDefault(address.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No addresses found. Add a new address to get started.</p>
      )}
    </div>
  );
}

export default Addresses;