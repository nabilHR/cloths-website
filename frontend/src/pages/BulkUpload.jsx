import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function BulkUpload() {
  const [pastedData, setPastedData] = useState('');
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();
  
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication required. Please log in.');
          return;
        }
        
        const response = await fetch('http://localhost:8000/api/categories/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          console.log("Categories loaded:", data);
        } else {
          console.error('Failed to fetch categories:', response.status);
          setError('Failed to load categories. Please refresh the page.');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Network error while loading categories.');
      }
    };
    
    fetchCategories();
  }, []);
  
  // Download sample CSV template
  const downloadSampleCSV = () => {
    const csvContent = 
      "Name,Price,Description,Sizes\n" +
      "T-Shirt Example,29.99,\"Comfortable cotton t-shirt, perfect for daily wear\",\"S,M,L,XL\"\n" +
      "Jeans Example,49.99,\"Classic blue denim jeans\",\"30,32,34,36\"";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Handle CSV file upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      parseCsvToProducts(csvText);
    };
    reader.readAsText(file);
  };
  
  // Parse CSV text to product objects
  const parseCsvToProducts = (csvText) => {
    try {
      // Split input into rows
      const rows = csvText.split('\n').filter(row => row.trim());
      
      if (rows.length === 0) {
        setError('No data found in CSV');
        return;
      }
      
      // Check if first row looks like a header
      const firstRow = rows[0].toLowerCase();
      const hasHeader = firstRow.includes('name') || 
                        firstRow.includes('product') || 
                        firstRow.includes('price');
      
      // Start parsing from the appropriate row
      const startRow = hasHeader ? 1 : 0;
      
      const parsedProducts = [];
      
      for (let i = startRow; i < rows.length; i++) {
        // Handle quoted values with commas inside
        let cols = [];
        let currentRow = rows[i];
        let inQuotes = false;
        let currentCol = '';
        
        for (let j = 0; j < currentRow.length; j++) {
          if (currentRow[j] === '"' && (j === 0 || currentRow[j-1] !== '\\')) {
            inQuotes = !inQuotes;
          } else if (currentRow[j] === ',' && !inQuotes) {
            cols.push(currentCol);
            currentCol = '';
          } else {
            currentCol += currentRow[j];
          }
        }
        cols.push(currentCol); // Add the last column
        
        if (cols.length < 2) continue; // Skip if not enough columns
        
        // Assume fixed order: name, price, description, sizes
        const product = {
          name: cols[0].replace(/"/g, '').trim(),
          price: parseFloat(cols[1].replace(/[^0-9.]/g, '')),
          description: cols.length > 2 ? cols[2].replace(/"/g, '').trim() : '',
          sizes: cols.length > 3 
            ? cols[3].replace(/"/g, '').split(',').map(s => s.trim())
            : ['S', 'M', 'L'],
          category: categories.length > 0 ? categories[0].id : "",
          slug: cols[0].replace(/"/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          in_stock: true
        };
        
        // Validate product
        if (!product.name || isNaN(product.price) || product.price <= 0) {
          console.warn(`Skipping invalid product at row ${i+1}:`, product);
          continue;
        }
        
        parsedProducts.push(product);
      }
      
      console.log("Parsed products:", parsedProducts);
      setProducts(parsedProducts);
      setError('');
    } catch (err) {
      setError('Error parsing CSV: ' + err.message);
      console.error('CSV parsing error:', err);
    }
  };
  
  // Extract shared parsing logic into a separate function
  const parseProductRow = (cols, categories) => {
    // Create product object from columns
    const product = {
      name: cols[0].replace(/"/g, '').trim(),
      price: parseFloat(cols[1].replace(/[^0-9.]/g, '')),
      description: cols.length > 2 ? cols[2].replace(/"/g, '').trim() : '',
      sizes: cols.length > 3 
        ? cols[3].replace(/"/g, '').split(',').map(s => s.trim())
        : ['S', 'M', 'L'],
      category: categories.length > 0 ? categories[0].id : "",
      slug: cols[0].replace(/"/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      in_stock: true
    };
    
    return product;
  };
  
  // Handle pasted data change
  const handlePastedData = (e) => {
    setPastedData(e.target.value);
  };
  
  // Parse pasted data to product objects
  const parsePastedData = () => {
    try {
      // Split input into rows
      const rows = pastedData.split('\n').filter(row => row.trim());
      
      if (rows.length === 0) {
        setError('No data found in pasted content');
        return;
      }
      
      // Check if first row looks like a header
      const firstRow = rows[0].toLowerCase();
      const hasHeader = firstRow.includes('name') || 
                        firstRow.includes('product') || 
                        firstRow.includes('price');
      
      // Start parsing from the appropriate row
      const startRow = hasHeader ? 1 : 0;
      
      const parsedProducts = [];
      
      for (let i = startRow; i < rows.length; i++) {
        // Handle quoted values with commas inside
        let cols = [];
        let currentRow = rows[i];
        let inQuotes = false;
        let currentCol = '';
        
        for (let j = 0; j < currentRow.length; j++) {
          if (currentRow[j] === '"' && (j === 0 || currentRow[j-1] !== '\\')) {
            inQuotes = !inQuotes;
          } else if (currentRow[j] === ',' && !inQuotes) {
            cols.push(currentCol);
            currentCol = '';
          } else {
            currentCol += currentRow[j];
          }
        }
        cols.push(currentCol); // Add the last column
        
        if (cols.length < 2) continue; // Skip if not enough columns
        
        // Assume fixed order: name, price, description, sizes
        const product = {
          name: cols[0].replace(/"/g, '').trim(),
          price: parseFloat(cols[1].replace(/[^0-9.]/g, '')),
          description: cols.length > 2 ? cols[2].replace(/"/g, '').trim() : '',
          sizes: cols.length > 3 
            ? cols[3].replace(/"/g, '').split(',').map(s => s.trim())
            : ['S', 'M', 'L'],
          category: categories.length > 0 ? categories[0].id : "",
          slug: cols[0].replace(/"/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          in_stock: true
        };
        
        // Validate product
        if (!product.name || isNaN(product.price) || product.price <= 0) {
          console.warn(`Skipping invalid product at row ${i+1}:`, product);
          continue;
        }
        
        parsedProducts.push(product);
      }
      
      console.log("Parsed products from pasted data:", parsedProducts);
      setProducts(parsedProducts);
      setError('');
    } catch (err) {
      setError('Error parsing pasted data: ' + err.message);
      console.error('Pasted data parsing error:', err);
    }
  };
  
  // Handle image file upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);
  };
  
  // Remove image at specific index
  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };
  
  // Handle product property change
  const handleProductChange = (index, field, value) => {
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
      return updatedProducts;
    });
  };
  
  // Remove product at specific index
  const removeProduct = (index) => {
    setProducts(prevProducts => prevProducts.filter((_, i) => i !== index));
  };
  
  // Validate all products before submission
  const validateProducts = () => {
    const errors = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.name || product.name.trim() === '') {
        errors.push(`Product #${i+1}: Name is required`);
      }
      
      if (isNaN(product.price) || product.price <= 0) {
        errors.push(`Product #${i+1}: Valid price is required`);
      }
      
      if (!product.category) {
        errors.push(`Product #${i+1}: Category is required`);
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return false;
    }
    
    return true;
  };
  
  // Confirm submission
  const confirmSubmit = () => {
    if (!validateProducts()) {
      return;
    }
    
    if (products.length > 10) {
      setShowConfirmation(true);
    } else {
      handleSubmit();
    }
  };
  
  // Submit products to backend
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setShowConfirmation(false);
    
    try {
      // Validate products
      if (products.length === 0) {
        setError('No products to upload');
        setLoading(false);
        return;
      }
      
      // Make sure category is a number
      const productsWithCategoryIds = products.map(product => ({
        ...product,
        category: product.category ? parseInt(product.category, 10) : 
                  (categories.length > 0 ? categories[0].id : null)
      }));
      
      // Create form data
      const formData = new FormData();
      
      // Add products data as JSON
      formData.append('products', JSON.stringify(productsWithCategoryIds));
      
      // Add images if available
      images.forEach(image => {
        formData.append('images', image);
      });
      
      console.log('Sending products:', productsWithCategoryIds);
      console.log('Images count:', images.length);
      
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      // Send request
      const response = await fetch('http://localhost:8000/api/bulk-products/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Upload successful:', data);
        setSuccess(true);
        setProducts([]);
        setImages([]);
        setPastedData('');
        
        // Redirect to home after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        console.error('Upload failed:', data);
        setError(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Error submitting products:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Bulk Upload Products</h1>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6 whitespace-pre-line">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md mb-6">
          Products uploaded successfully!
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Enter Product Data</h2>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Option A: Upload CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-black file:text-white
              hover:file:bg-gray-800"
          />
          <div className="flex items-center mt-1">
            <p className="text-sm text-gray-500">
              CSV should have columns for name, price, description, and sizes (optional)
            </p>
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="ml-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Download Sample
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Option B: Paste Data</h3>
          <textarea
            rows="6"
            placeholder="Paste your data here (tab or comma separated)"
            value={pastedData}
            onChange={handlePastedData}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          ></textarea>
          <button
            type="button"
            onClick={parsePastedData}
            className="mt-2 py-2 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
          >
            Parse Data
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Upload Images</h2>
        <p className="text-sm text-gray-500 mb-2">
          Images will be assigned to products in the order they are uploaded. Upload {products.length} images for {products.length} products.
        </p>
        
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-black file:text-white
            hover:file:bg-gray-800"
        />
        
        {images.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Selected Images ({images.length})</h3>
            <div className="grid grid-cols-5 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                  <span className="block text-xs text-center mt-1 text-gray-500">
                    {products[index]?.name ? `For: ${products[index].name.substring(0, 15)}${products[index].name.length > 15 ? '...' : ''}` : `Image ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
            
            {images.length !== products.length && (
              <p className="text-amber-600 text-sm mt-2">
                Warning: You have {products.length} products but {images.length} images. Each product should have an image.
              </p>
            )}
          </div>
        )}
      </div>
      
      {products.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            3. Review Products ({products.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sizes
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <span className="mr-1">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={parseFloat(product.price).toFixed(2)}
                          onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={product.category || ""}
                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={product.sizes.join(', ')}
                        onChange={(e) => handleProductChange(index, 'sizes', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showConfirmation ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6">
          <h3 className="font-medium text-amber-800 mb-2">Confirm Upload</h3>
          <p className="text-amber-700 mb-4">
            You're about to upload {products.length} products. This might take a while. Are you sure you want to continue?
          </p>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Yes, Upload All
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={confirmSubmit}
          disabled={loading || products.length === 0}
          className={`w-full py-3 ${
            loading || products.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          } text-white rounded-md transition`}
        >
          {loading ? 'Uploading...' : 'Upload Products'}
        </button>
      )}
    </div>
  );
}

export default BulkUpload;