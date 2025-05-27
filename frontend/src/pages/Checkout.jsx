import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Checkout() {
  const { cartItems: cart, getSubtotal: calculateTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    cardName: '',
    cardNumber: '',
    expDate: '',
    cvv: ''
  });
  
  // Current checkout step
  const [step, setStep] = useState(1);
  
  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Calculate order totals
  const subtotal = calculateTotal();
  const shipping = subtotal > 0 ? 10 : 0;
  const total = subtotal + shipping;
  
  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);
  
  // Fetch saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const response = await fetch('http://localhost:8000/api/shipping-addresses/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSavedAddresses(data);
          
          // Auto-select default address if available
          const defaultAddress = data.find(addr => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setFormData(prev => ({
              ...prev,
              firstName: defaultAddress.first_name,
              lastName: defaultAddress.last_name,
              address: defaultAddress.address,
              city: defaultAddress.city,
              postalCode: defaultAddress.postal_code,
              country: defaultAddress.country
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      }
    };
    
    fetchAddresses();
  }, []);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle address selection
  const handleAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    
    if (addressId) {
      const selectedAddress = savedAddresses.find(addr => addr.id.toString() === addressId);
      if (selectedAddress) {
        setFormData(prev => ({
          ...prev,
          firstName: selectedAddress.first_name,
          lastName: selectedAddress.last_name,
          address: selectedAddress.address,
          city: selectedAddress.city,
          postalCode: selectedAddress.postal_code,
          country: selectedAddress.country
        }));
      }
    } else {
      // Clear address fields if "Enter New Address" is selected
      setFormData(prev => ({
        ...prev,
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        postalCode: '',
        country: ''
      }));
    }
  };
  
  // Go to next step
  const nextStep = (e) => {
    e.preventDefault();
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  
  // Go to previous step
  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };
  
  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('You must be logged in to place an order');
        setLoading(false);
        return;
      }
      
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          size: item.size
        })),
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country
        },
        payment: {
          // In a real app, you'd use a secure payment processor
          // This is just for demonstration
          card_name: formData.cardName,
          // Don't send full card details - use a token from a service like Stripe
          last_four: formData.cardNumber.slice(-4)
        }
      };
      
      const response = await fetch('http://localhost:8000/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Clear cart and redirect to confirmation page
        clearCart();
        navigate(`/order-confirmation/${data.id}`);
      } else {
        setError(data.detail || 'Failed to create order');
      }
    } catch (err) {
      setError('An error occurred while placing your order');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Render shipping form (step 1)
  const renderShippingForm = () => (
    <form onSubmit={nextStep} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          name="address"
          id="address"
          required
          value={formData.address}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            id="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input
            type="text"
            name="postalCode"
            id="postalCode"
            required
            value={formData.postalCode}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            name="country"
            id="country"
            required
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select Country</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="AU">Australia</option>
            {/* Add more countries as needed */}
          </select>
        </div>
      </div>
      
      {/* Saved addresses section */}
      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <label htmlFor="savedAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Use Saved Address
          </label>
          <select
            id="savedAddress"
            value={selectedAddressId}
            onChange={handleAddressSelect}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Enter New Address</option>
            {savedAddresses.map(address => (
              <option key={address.id} value={address.id}>
                {address.first_name} {address.last_name}, {address.address}, {address.city}
                {address.is_default ? ' (Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="pt-4">
        <button
          type="submit"
          className="w-full py-3 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          Continue to Payment
        </button>
      </div>
    </form>
  );
  
  // Render payment form (step 2)
  const renderPaymentForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
        <input
          type="text"
          name="cardName"
          id="cardName"
          required
          value={formData.cardName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
        <input
          type="text"
          name="cardNumber"
          id="cardNumber"
          required
          placeholder="XXXX XXXX XXXX XXXX"
          value={formData.cardNumber}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expDate" className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
          <input
            type="text"
            name="expDate"
            id="expDate"
            required
            placeholder="MM/YY"
            value={formData.expDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
          <input
            type="text"
            name="cvv"
            id="cvv"
            required
            placeholder="123"
            value={formData.cvv}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>
      
      <div className="pt-4 flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
        <button
          type="button"
          onClick={prevStep}
          className="py-3 px-6 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Back to Shipping
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="py-3 px-6 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 lg:mb-0">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {step === 1 ? 'Shipping Information' : 'Payment Information'}
                </h2>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full ${step >= 1 ? 'bg-black' : 'bg-gray-300'}`}></div>
                  <div className={`h-1 w-8 ${step >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
                  <div className={`h-3 w-3 rounded-full ${step >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {step === 1 ? renderShippingForm() : renderPaymentForm()}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>
            
            <div className="p-6 max-h-96 overflow-auto">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center mb-4 pb-4 border-b last:border-0 last:pb-0 last:mb-0">
                  <div className="w-16 h-16 flex-shrink-0 mr-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  
                  <div className="font-medium">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;