// filepath: /home/eren/Desktop/cloths-store/frontend/src/pages/admin/ProductEditPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
// You'll need form components, e.g., Input, Textarea, Select, FileInput

const ProductEditPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category: '', // Store category ID
        sub_category: '', // Store sub_category ID
        // Add other fields as needed
    });
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]); // For new images
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]); // IDs of images to delete
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch product details and categories/subcategories
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                // Fetch product
                const productRes = await fetch(`http://localhost:8000/api/products/${productId}/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (!productRes.ok) throw new Error('Failed to fetch product');
                const productData = await productRes.json();
                setProduct(productData);
                setFormData({
                    name: productData.name || '',
                    description: productData.description || '',
                    price: productData.price || '',
                    stock_quantity: productData.stock_quantity || '',
                    category: productData.category?.id || '',
                    sub_category: productData.sub_category?.id || '',
                });
                setExistingImages(productData.images || []);

                // Fetch categories (assuming an endpoint like /api/categories/)
                const catRes = await fetch(`http://localhost:8000/api/categories/`, {
                     headers: { 'Authorization': `Token ${token}` }
                });
                if (catRes.ok) setCategories(await catRes.json());
                
                // Fetch sub-categories (or filter them based on selected category later)
                // This might depend on your API structure
                if (productData.category?.id) {
                    const subCatRes = await fetch(`http://localhost:8000/api/subcategories/?category_id=${productData.category.id}`, {
                        headers: { 'Authorization': `Token ${token}` }
                    });
                    if (subCatRes.ok) setSubCategories(await subCatRes.json());
                }


            } catch (error) {
                toast.error(error.message || 'Could not load data.');
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [productId]);
    
    // Fetch subcategories when category changes
    useEffect(() => {
        const fetchSubCats = async () => {
            if (formData.category) {
                try {
                    const token = localStorage.getItem('authToken');
                    const subCatRes = await fetch(`http://localhost:8000/api/subcategories/?category_id=${formData.category}`, {
                         headers: { 'Authorization': `Token ${token}` }
                    });
                    if (subCatRes.ok) {
                        setSubCategories(await subCatRes.json());
                    } else {
                        setSubCategories([]);
                    }
                } catch (error) {
                    console.error("Error fetching subcategories:", error);
                    setSubCategories([]);
                }
            } else {
                setSubCategories([]);
            }
        };
        fetchSubCats();
    }, [formData.category]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const toggleImageForDeletion = (imageId) => {
        setImagesToDelete(prev => 
            prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('authToken');

        // Use FormData if you are uploading files
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('description', formData.description);
        payload.append('price', formData.price);
        payload.append('stock_quantity', formData.stock_quantity);
        if (formData.category) payload.append('category', formData.category);
        if (formData.sub_category) payload.append('sub_category', formData.sub_category);
        
        // Add new images
        selectedFiles.forEach(file => {
            payload.append('new_images_files_field_name', file); // Match backend field name
        });

        // Add IDs of images to delete
        // Your backend needs to be set up to handle this field, e.g., 'images_to_delete'
        imagesToDelete.forEach(id => {
            payload.append('images_to_delete', id);
        });


        try {
            const response = await fetch(`http://localhost:8000/api/products/${productId}/`, {
                method: 'PATCH', // or 'PUT'
                headers: {
                    'Authorization': `Token ${token}`,
                    // 'Content-Type': 'application/json', // Remove if using FormData
                },
                body: payload, // Use FormData if files are involved
                // body: JSON.stringify(formData), // Use if no files
            });

            if (response.ok) {
                toast.success('Product updated successfully!');
                navigate(`/admin/products`); // Or back to product detail page
            } else {
                const errorData = await response.json();
                console.error("Update error data:", errorData);
                let errorMessage = 'Failed to update product.';
                if (errorData) {
                    errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
                }
                toast.error(errorMessage);
            }
        } catch (error) {
            toast.error('An error occurred during update.');
            console.error("Submit error:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-10">Loading product details...</div>;
    if (!product) return <div className="text-center p-10">Product not found.</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Edit Product: {product.name}</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-lg rounded-lg">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required 
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows="4"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                        <input type="number" name="price" id="price" value={formData.price} onChange={handleInputChange} required step="0.01"
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                        <input type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} required step="1"
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select name="category" id="category" value={formData.category} onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Select Category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sub_category" className="block text-sm font-medium text-gray-700">Sub-Category</label>
                        <select name="sub_category" id="sub_category" value={formData.sub_category} onChange={handleInputChange}
                                disabled={!formData.category || subCategories.length === 0}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50">
                            <option value="">Select Sub-Category</option>
                            {subCategories.map(subCat => <option key={subCat.id} value={subCat.id}>{subCat.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Existing Images Management */}
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Existing Images</h3>
                    {existingImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {existingImages.map(img => (
                                <div key={img.id} className="relative group">
                                    <img src={img.image_url || img.image} alt="Product" className="w-full h-32 object-cover rounded-md" />
                                    <button type="button" onClick={() => toggleImageForDeletion(img.id)}
                                            className={`absolute top-1 right-1 p-1 rounded-full text-white
                                                        ${imagesToDelete.includes(img.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 bg-opacity-50 hover:bg-red-600'}`}>
                                        {imagesToDelete.includes(img.id) ? 'Undo' : 'Delete'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500">No existing images.</p>}
                </div>

                {/* New Image Upload */}
                <div className="mt-6">
                    <label htmlFor="new_images" className="block text-sm font-medium text-gray-700">Add New Images</label>
                    <input type="file" name="new_images" id="new_images" onChange={handleFileChange} multiple
                           className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    {selectedFiles.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                            {selectedFiles.length} file(s) selected.
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => navigate(-1)} disabled={saving}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductEditPage;