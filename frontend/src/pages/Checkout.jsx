import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';
import {loadStripe} from '@stripe/stripe-js';
import {Elements, CardElement, useStripe, useElements} from '@stripe/react-stripe-js';

// Initialize Stripe
console.log("Stripe key:", import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function Checkout() {
  const { cartItems, clearCart, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  // Log if Stripe is loaded
  console.log("Stripe loaded:", !!stripe);
  console.log("Elements loaded:", !!elements);
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  
  // Form states
  const [shippingFormData, setShippingFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  
  // Fetch addresses on component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        // Check if token exists
        if (!token) {
          console.error('No authentication token found');
          showToast.error('Please log in to continue checkout');
          navigate('/login');
          return;
        }
        
        console.log('Using auth token:', token);
        
        const response = await fetch('http://localhost:8000/api/addresses/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setAddresses(data);
          // Select the default address if available
          const defaultAddress = data.find(addr => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else if (data.length > 0) {
            setSelectedAddressId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
        showToast.error('Failed to fetch addresses');
      }
    };
    
    fetchAddresses();
  }, []);
  
  // Check if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      showToast.error('Your cart is empty');
    }
  }, [cartItems, navigate]);
  
  const handleShippingInputChange = (e) => {
    const { name, value } = e.target;
    setShippingFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    setShowAddAddressForm(false);
  };
  
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    
    if (selectedAddressId || (
      shippingFormData.fullName && 
      shippingFormData.address && 
      shippingFormData.city && 
      shippingFormData.state && 
      shippingFormData.zipCode && 
      shippingFormData.country
    )) {
      setStep(2);
    } else {
      showToast.error('Please select an address or fill in all required fields');
    }
  };
  
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'credit_card') {
      // Only validate cardHolder since CardElement handles the rest
      if (!paymentFormData.cardHolder) {
        showToast.error('Please enter cardholder name');
        return;
      }
      
      // Make sure Stripe is loaded and CardElement has been used
      if (!stripe || !elements) {
        showToast.error('Payment processing not available');
        return;
      }
    }
    
    setStep(3);
  };
  
  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      console.log("Starting order creation...");
      
      // 1. Prepare order data with exact format backend expects
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.id, // <-- must be product_id
          quantity: item.quantity,
          size: item.selectedSize || '',
          color: item.selectedColor || ''
        })),
        shipping_address: selectedAddressId || null,
        shipping_address_data: !selectedAddressId ? {
          full_name: shippingFormData.fullName,
          address: shippingFormData.address,
          city: shippingFormData.city,
          state: shippingFormData.state,
          zip_code: shippingFormData.zipCode,
          country: shippingFormData.country,
          phone: shippingFormData.phone
        } : null,
      };
      
      console.log("Order payload:", JSON.stringify(orderData, null, 2));
      
      // 2. Create order
      const orderResponse = await fetch('http://localhost:8000/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(orderData)
      });
      
      console.log("Order response status:", orderResponse.status);
      
      // 3. Handle response
      if (!orderResponse.ok) {
        let errorText = 'Unknown error';
        
        const contentType = orderResponse.headers.get('content-type');
        const responseClone = orderResponse.clone(); // Clone before reading
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorJson = await orderResponse.json();
            errorText = JSON.stringify(errorJson);
            console.error("Order error JSON:", errorJson);
          } else {
            errorText = await responseClone.text();
            console.error("Order error text:", errorText);
          }
        } catch (e) {
          console.error("Error parsing response:", e);
          // Don't try to read the body again
        }
        
        throw new Error(`Order creation failed: ${errorText}`);
      }
      
      const createdOrder = await orderResponse.json();
      console.log("Order created successfully:", createdOrder);
      
      // Skip payment for now and just complete the order
      showToast.success("Order created successfully!");
      clearCart();
      navigate('/order-success');
      
    } catch (err) {
      console.error('Order creation error:', err);
      showToast.error(err.message || 'Order creation failed');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) || 0) * item.quantity;
    }, 0);
  };
  
  const getItemPrice = (item) => {
    const price = parseFloat(item.price);
    return isNaN(price) ? 0 : price;
  };
  
  // Render different steps
  const renderShippingStep = () => (
    <div>
      <h2 className="text-xl font-medium mb-6">Shipping Information</h2>
      
      {/* Saved addresses */}
      {addresses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Select a saved address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(address => (
              <div 
                key={address.id}
                onClick={() => handleAddressSelect(address.id)}
                className={`border p-4 rounded-lg cursor-pointer ${
                  selectedAddressId === address.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{address.full_name}</div>
                <div className="text-gray-700">{address.address}</div>
                <div className="text-gray-700">
                  {address.city}, {address.state} {address.zip_code}
                </div>
                <div className="text-gray-700">{address.country}</div>
                <div className="text-gray-700">{address.phone}</div>
                {address.is_default && (
                  <div className="mt-2 text-sm text-gray-500">Default address</div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAddAddressForm(!showAddAddressForm)}
              className="text-blue-600 hover:underline"
            >
              {showAddAddressForm ? 'Cancel' : 'Use a different address'}
            </button>
          </div>
        </div>
      )}
      
      {/* New address form */}
      {(showAddAddressForm || addresses.length === 0) && (
        <form onSubmit={handleShippingSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name*
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={shippingFormData.fullName}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number*
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={shippingFormData.phone}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address*
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={shippingFormData.address}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City*
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={shippingFormData.city}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province*
              </label>
              <input
                id="state"
                name="state"
                type="text"
                required
                value={shippingFormData.state}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP / Postal Code*
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                required
                value={shippingFormData.zipCode}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country*
              </label>
              <select
                id="country"
                name="country"
                required
                value={shippingFormData.country}
                onChange={handleShippingInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="UK">United Kingdom</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="JP">Japan</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
          
          {/* Save address checkbox */}
          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="saveAddress"
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Save this address for future orders
              </span>
            </label>
          </div>
        </form>
      )}
      
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => navigate('/cart')}
          className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Cart
        </button>
        
        <button
          onClick={handleShippingSubmit}
          className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
  
  const renderPaymentStep = () => (
    <div>
      <h2 className="text-xl font-medium mb-6">Payment Method</h2>
      
      <div className="space-y-4 mb-8">
        {/* Credit Card Payment */}
        <div>
          <label className="flex items-center mb-4">
            <input
              type="radio"
              name="paymentMethod"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
              className="h-4 w-4 text-black focus:ring-black border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Credit/Debit Card
            </span>
          </label>
          
          {paymentMethod === 'credit_card' && (
            <form onSubmit={handlePaymentSubmit} className="ml-6 p-4 border border-gray-200 rounded-md">
              <div className="space-y-4">
                <div>
                  <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    id="cardHolder"
                    name="cardHolder"
                    type="text"
                    placeholder="John Doe"
                    value={paymentFormData.cardHolder}
                    onChange={handlePaymentInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Details
                  </label>
                  <div className="p-4 border border-gray-300 rounded-md bg-white" style={{ minHeight: '70px' }}>
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                            padding: '12px 0',
                          },
                          invalid: {
                            color: '#9e2146',
                          },
                        },
                        hidePostalCode: true
                      }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Test card: 4242 4242 4242 4242 | Any future date | Any 3 digits for CVC
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
        
        {/* PayPal */}
        <div>
          <label className="flex items-center mb-4">
            <input
              type="radio"
              name="paymentMethod"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={() => setPaymentMethod('paypal')}
              className="h-4 w-4 text-black focus:ring-black border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              PayPal
            </span>
          </label>
          
          {paymentMethod === 'paypal' && (
            <div className="ml-6 p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700">
                You will be redirected to PayPal to complete your payment.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Shipping
        </button>
        
        <button
          onClick={handlePaymentSubmit}
          className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Review Order
        </button>
      </div>
    </div>
  );
  
  const renderReviewStep = () => (
    <div>
      <h2 className="text-xl font-medium mb-6">Review Your Order</h2>
      
      {/* Order Items */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cartItems.map(item => (
              <tr key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img 
                        src={item.image || 'https://placehold.co/100x100'} 
                        alt={item.name}
                        className="h-10 w-10 object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {item.selectedSize && <div>Size: {item.selectedSize}</div>}
                    {item.selectedColor && <div>Color: {item.selectedColor}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  ${getItemPrice(item).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  ${(getItemPrice(item) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Order Summary */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-medium mb-4">Order Summary</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${calculateTotalPrice().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${(calculateTotalPrice() * 0.1).toFixed(2)}</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 flex justify-between font-medium">
          <span>Total</span>
          <span>${(calculateTotalPrice() * 1.1).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Shipping & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Shipping Information</h3>
          {selectedAddressId ? (
            // Display selected address
            (() => {
              const address = addresses.find(a => a.id === selectedAddressId);
              return address ? (
                <div>
                  <p className="font-medium">{address.full_name}</p>
                  <p>{address.address}</p>
                  <p>{address.city}, {address.state} {address.zip_code}</p>
                  <p>{address.country}</p>
                  <p>{address.phone}</p>
                </div>
              ) : null;
            })()
          ) : (
            // Display form data
            <div>
              <p className="font-medium">{shippingFormData.fullName}</p>
              <p>{shippingFormData.address}</p>
              <p>{shippingFormData.city}, {shippingFormData.state} {shippingFormData.zipCode}</p>
              <p>{shippingFormData.country}</p>
              <p>{shippingFormData.phone}</p>
            </div>
          )}
          
          <button 
            onClick={() => setStep(1)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Change
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Payment Method</h3>
          {paymentMethod === 'credit_card' ? (
            <div>
              <p>Credit Card</p>
              <p>Card details provided via Stripe</p>
              <p>Cardholder: {paymentFormData.cardHolder}</p>
            </div>
          ) : (
            <div>
              <p>PayPal</p>
              <p>You will be redirected to complete payment</p>
            </div>
          )}
          
          <button 
            onClick={() => setStep(2)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Change
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Payment
        </button>
        
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Place Order'
          )}
        </button>
      </div>
    </div>
  );
  
  // Checkout Steps Indicator
  const renderStepIndicator = () => (
    <div className="mb-12">
      <div className="flex items-center justify-center">
        <div className="flex items-center relative">
          {/* Step 1 */}
          <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-black bg-white z-10">
              <span className="text-black">1</span>
            </div>
            <div className="absolute mt-12 w-max text-center -ml-4">
              <span className="text-sm font-medium">Shipping</span>
            </div>
          </div>
          
          {/* Connector */}
          <div className={`step-connector ${step >= 2 ? 'active' : ''}`}>
            <div className="w-24 h-1 bg-gray-300 mx-2"></div>
          </div>
          
          {/* Step 2 */}
          <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-black' : 'border-gray-300'} ${step >= 2 ? 'bg-white' : 'bg-gray-100'} z-10`}>
              <span className={step >= 2 ? 'text-black' : 'text-gray-500'}>2</span>
            </div>
            <div className="absolute mt-12 w-max text-center -ml-4">
              <span className={`text-sm font-medium ${step >= 2 ? 'text-black' : 'text-gray-500'}`}>Payment</span>
            </div>
          </div>
          
          {/* Connector */}
          <div className={`step-connector ${step >= 3 ? 'active' : ''}`}>
            <div className="w-24 h-1 bg-gray-300 mx-2"></div>
          </div>
          
          {/* Step 3 */}
          <div className={`step-circle ${step >= 3 ? 'active' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-black' : 'border-gray-300'} ${step >= 3 ? 'bg-white' : 'bg-gray-100'} z-10`}>
              <span className={step >= 3 ? 'text-black' : 'text-gray-500'}>3</span>
            </div>
            <div className="absolute mt-12 w-max text-center -ml-4">
              <span className={`text-sm font-medium ${step >= 3 ? 'text-black' : 'text-gray-500'}`}>Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light mb-8 text-center">Checkout</h1>
      
      {renderStepIndicator()}
      
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
        {step === 1 && renderShippingStep()}
        {step === 2 && renderPaymentStep()}
        {step === 3 && renderReviewStep()}
      </div>
    </div>
  );
}

function CheckoutWithStripe() {
  return (
    <Elements stripe={stripePromise}>
      <Checkout />
    </Elements>
  );
}

export default CheckoutWithStripe;