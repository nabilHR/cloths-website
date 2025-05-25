import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function BulkUpload() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [csvData, setCsvData] = useState(null);
  const [pastedData, setPastedData] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories for the dropdown
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories/');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvText = event.target.result;
        setCsvData(csvText);
        parseCsvToProducts(csvText);
      };
      reader.readAsText(file);
    }
  };

  const handlePastedData = (e) => {
    const text = e.target.value;
    setPastedData(text);
  };

  const parsePastedData = () => {
    try {
      // Assume tab or comma separated values
      const rows = pastedData.split('\n').filter(row => row.trim());
      
      if (rows.length === 0) {
        setError('No data found in pasted content');
        return;
      }
      
      // Parse header row to identify columns
      const header = rows[0].split('\t').length > 1 
        ? rows[0].split('\t') 
        : rows[0].split(',');
      
      const nameIndex = header.findIndex(col => 
        col.toLowerCase().includes('name') || col.toLowerCase().includes('product'));
      const priceIndex = header.findIndex(col => 
        col.toLowerCase().includes('price'));
      const descIndex = header.findIndex(col => 
        col.toLowerCase().includes('desc'));
      const sizeIndex = header.findIndex(col => 
        col.toLowerCase().includes('size'));
      
      if (nameIndex === -1 || priceIndex === -1) {
        setError('Could not identify name and price columns in the data');
        return;
      }
      
      const parsedProducts = [];
      
      // Start from 1 to skip header row
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split('\t').length > 1 
          ? rows[i].split('\t') 
          : rows[i].split(',');
        
        if (cols.length <= 1) continue;
        
        const product = {
          name: cols[nameIndex].trim(),
          price: parseFloat(cols[priceIndex].replace(/[^0-9.]/g, '')),
          description: descIndex !== -1 ? cols[descIndex].trim() : '',
          sizes: sizeIndex !== -1 ? cols[sizeIndex].split('/').map(s => s.trim()) : ['S', 'M', 'L'],
          category: categories.length > 0 ? categories[0].id : null,
          // Generate a slug from the name
          slug: cols[nameIndex].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
        
        parsedProducts.push(product);
      }
      
      setProducts(parsedProducts);
      setError('');
    } catch (err) {
      setError('Error parsing pasted data: ' + err.message);
    }
  };

  const parseCsvToProducts = (csvText) => {
    try {
      const rows = csvText.split('\n').filter(row => row.trim());
      
      if (rows.length === 0) {
        setError('No data found in CSV');
        return;
      }
      
      // Parse header row
      const header = rows[0].split(',');
      
      const nameIndex = header.findIndex(col => 
        col.toLowerCase().includes('name') || col.toLowerCase().includes('product'));
      const priceIndex = header.findIndex(col => 
        col.toLowerCase().includes('price'));
      const descIndex = header.findIndex(col => 
        col.toLowerCase().includes('desc'));
      const sizeIndex = header.findIndex(col => 
        col.toLowerCase().includes('size'));
      
      if (nameIndex === -1 || priceIndex === -1) {
        setError('Could not identify name and price columns in CSV');
        return;
      }
      
      const parsedProducts = [];
      
      // Start from 1 to skip header
      for (let i = 1; i < rows.length; i++) {
        // Handle possible quoted values with commas inside
        let cols = [];
        let row = rows[i];
        let inQuotes = false;
        let currentCol = '';
        
        for (let j = 0; j < row.length; j++) {
          if (row[j] === '"' && (j === 0 || row[j-1] !== '\\')) {
            inQuotes = !inQuotes;
          } else if (row[j] === ',' && !inQuotes) {
            cols.push(currentCol);
            currentCol = '';
          } else {
            currentCol += row[j];
          }
        }
        cols.push(currentCol); // Add the last column
        
        if (cols.length <= 1) continue;
        
        const product = {
          name: cols[nameIndex].replace(/"/g, '').trim(),
          price: parseFloat(cols[priceIndex].replace(/[^0-9.]/g, '')),
          description: descIndex !== -1 ? cols[descIndex].replace(/"/g, '').trim() : '',
          sizes: sizeIndex !== -1 
            ? cols[sizeIndex].replace(/"/g, '').split('/').map(s => s.trim()) 
            : ['S', 'M', 'L'],
          category: categories.length > 0 ? categories[0].id : null,
          slug: cols[nameIndex].replace(/"/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
        
        parsedProducts.push(product);
      }
      
      setProducts(parsedProducts);
      setError('');
    } catch (err) {
      setError('Error parsing CSV: ' + err.message);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);
  };

  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (products.length === 0) {
      setError('No products to upload');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login', { state: { from: '/bulk-upload' } });
        return;
      }
      
      // Create FormData for multipart/form-data (for images)
      const formData = new FormData();
      
      // Add product data as JSON
      formData.append('products', JSON.stringify(products));
      
      // Add images
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      
      const response = await fetch('http://localhost:8000/api/bulk-products/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload products');
      }
      
      setSuccess(true);
      // Clear form after successful upload
      setProducts([]);
      setImages([]);
      setPastedData('');
      setCsvData(null);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Bulk Upload Products</h1>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
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
          <p className="text-sm text-gray-500 mt-1">
            CSV should have columns for name, price, description, and sizes (optional)
          </p>
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
                </div>
              ))}
            </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <select
                        value={product.category}
                        onChange={(e) => {
                          const updatedProducts = [...products];
                          updatedProducts[index].category = parseInt(e.target.value);
                          setProducts(updatedProducts);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {product.sizes.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || products.length === 0}
        className={`w-full py-3 ${
          loading || products.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800'
        } text-white rounded-md transition`}
      >
        {loading ? 'Uploading...' : 'Upload Products'}
      </button>
    </div>
  );
}

export default BulkUpload;