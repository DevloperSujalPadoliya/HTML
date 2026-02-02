// Product Management System - JavaScript

// State Management
let products = JSON.parse(localStorage.getItem('products')) || [];
let productImages = [];
let editingProductId = null;

// DOM Elements
const productForm = document.getElementById('productForm');
const editProductForm = document.getElementById('editProductForm');
const imageUploadArea = document.getElementById('imageUploadArea');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const productsTableBody = document.getElementById('productsTableBody');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const editProductModal = document.getElementById('editProductModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    renderProducts();
    updateStats();
    setupEventListeners();
    loadSavedDraft();
}

// Event Listeners Setup
function setupEventListeners() {
    // Form submissions
    productForm.addEventListener('submit', handleProductSubmit);
    editProductForm.addEventListener('submit', handleEditSubmit);

    // Image upload
    imageUploadArea.addEventListener('click', () => document.getElementById('productImages').click());
    imageUploadArea.addEventListener('dragover', handleDragOver);
    imageUploadArea.addEventListener('dragleave', handleDragLeave);
    imageUploadArea.addEventListener('drop', handleDrop);
    document.getElementById('productImages').addEventListener('change', handleImageSelect);

    // Form buttons
    document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);

    // Modal
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeModal);
    editProductModal.addEventListener('click', (e) => {
        if (e.target === editProductModal) closeModal();
    });

    // Search and filter
    document.getElementById('searchProducts').addEventListener('input', filterProducts);
    document.getElementById('filterCategory').addEventListener('change', filterProducts);

    // Sidebar navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// Image Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    imageUploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    imageUploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    imageUploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    processImageFiles(files);
}

function handleImageSelect(e) {
    const files = e.target.files;
    processImageFiles(files);
}

function processImageFiles(files) {
    const maxImages = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach(file => {
        if (productImages.length >= maxImages) {
            showToast('Maximum 5 images allowed');
            return;
        }

        if (file.size > maxSize) {
            showToast('File size must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Only image files are allowed');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            productImages.push({
                name: file.name,
                data: e.target.result
            });
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    imagePreviewContainer.innerHTML = '';
    productImages.forEach((image, index) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
            <img src="${image.data}" alt="${image.name}">
            <button type="button" class="remove-image" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        imagePreviewContainer.appendChild(preview);
    });
}

function removeImage(index) {
    productImages.splice(index, 1);
    renderImagePreviews();
}

// Form Handlers
function handleProductSubmit(e) {
    e.preventDefault();

    if (productImages.length === 0) {
        showToast('Please add at least one product image');
        return;
    }

    const product = createProductFromForm();
    products.push(product);
    saveProducts();
    renderProducts();
    updateStats();
    clearForm();
    showToast('Product added successfully!');
}

function handleEditSubmit(e) {
    e.preventDefault();

    const productIndex = products.findIndex(p => p.id === editingProductId);
    if (productIndex === -1) return;

    const updatedProduct = createUpdatedProductFromForm();
    products[productIndex] = updatedProduct;
    saveProducts();
    renderProducts();
    updateStats();
    closeModal();
    showToast('Product updated successfully!');
}

function createProductFromForm() {
    const dimensions = {
        length: document.getElementById('dimLength').value,
        width: document.getElementById('dimWidth').value,
        height: document.getElementById('dimHeight').value
    };

    return {
        id: generateId(),
        name: document.getElementById('productName').value.trim(),
        sku: document.getElementById('productSKU').value.trim(),
        category: document.getElementById('productCategory').value,
        brand: document.getElementById('productBrand').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        discountPrice: parseFloat(document.getElementById('productDiscount').value) || 0,
        stock: parseInt(document.getElementById('productStock').value) || 0,
        weight: parseFloat(document.getElementById('productWeight').value) || 0,
        dimensions: dimensions,
        images: [...productImages],
        color: document.getElementById('productColor').value.trim(),
        size: document.getElementById('productSize').value,
        material: document.getElementById('productMaterial').value.trim(),
        tags: document.getElementById('productTags').value.split(',').map(t => t.trim()).filter(t => t),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function createUpdatedProductFromForm() {
    return {
        id: editingProductId,
        name: document.getElementById('editProductName').value.trim(),
        sku: document.getElementById('editProductSKU').value.trim(),
        category: document.getElementById('editProductCategory').value,
        description: document.getElementById('editProductDescription').value.trim(),
        price: parseFloat(document.getElementById('editProductPrice').value) || 0,
        stock: parseInt(document.getElementById('editProductStock').value) || 0,
        status: document.getElementById('editProductStatus').value,
        updatedAt: new Date().toISOString()
    };
}

// Product Management
function renderProducts(filteredProducts = null) {
    const productsToRender = filteredProducts || products;
    
    if (productsToRender.length === 0) {
        productsTableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    productsTableBody.innerHTML = productsToRender.map(product => `
        <tr data-id="${product.id}">
            <td>
                ${product.images.length > 0 
                    ? `<img src="${product.images[0].data}" alt="${product.name}" class="product-image">`
                    : '<div class="product-image" style="background: #e0e0e0; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="color: #999;"></i></div>'
                }
            </td>
            <td>
                <div class="product-name" title="${product.name}">${product.name}</div>
            </td>
            <td><span class="product-sku">${product.sku}</span></td>
            <td><span class="product-category">${product.category}</span></td>
            <td><span class="product-price">$${product.price.toFixed(2)}</span></td>
            <td>
                <span class="product-stock ${getStockClass(product.stock)}">${product.stock}</span>
            </td>
            <td>
                <span class="status-badge ${product.status}">${product.status}</span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="action-btn edit" onclick="editProduct('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStockClass(stock) {
    if (stock === 0) return 'low';
    if (stock < 10) return 'low';
    if (stock < 50) return 'medium';
    return '';
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    
    // Populate form
    document.getElementById('editProductId').value = id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductSKU').value = product.sku;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductStatus').value = product.status;

    // Show modal
    editProductModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProducts();
    updateStats();
    showToast('Product deleted successfully');
}

function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('activeProducts').textContent = products.filter(p => p.status === 'active').length;
    document.getElementById('pendingProducts').textContent = products.filter(p => p.status === 'pending').length;
    
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toLocaleString();
}

// Search and Filter
function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;

    const filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                             product.sku.toLowerCase().includes(searchTerm) ||
                             product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

// Draft Management
function saveDraft() {
    const draft = {
        productName: document.getElementById('productName').value,
        productSKU: document.getElementById('productSKU').value,
        productCategory: document.getElementById('productCategory').value,
        productBrand: document.getElementById('productBrand').value,
        productDescription: document.getElementById('productDescription').value,
        productPrice: document.getElementById('productPrice').value,
        productDiscount: document.getElementById('productDiscount').value,
        productStock: document.getElementById('productStock').value,
        productWeight: document.getElementById('productWeight').value,
        productColor: document.getElementById('productColor').value,
        productSize: document.getElementById('productSize').value,
        productMaterial: document.getElementById('productMaterial').value,
        productTags: document.getElementById('productTags').value,
        images: productImages
    };

    localStorage.setItem('productDraft', JSON.stringify(draft));
    showToast('Draft saved successfully!');
}

function loadSavedDraft() {
    const draft = JSON.parse(localStorage.getItem('productDraft'));
    if (!draft) return;

    document.getElementById('productName').value = draft.productName || '';
    document.getElementById('productSKU').value = draft.productSKU || '';
    document.getElementById('productCategory').value = draft.productCategory || '';
    document.getElementById('productBrand').value = draft.productBrand || '';
    document.getElementById('productDescription').value = draft.productDescription || '';
    document.getElementById('productPrice').value = draft.productPrice || '';
    document.getElementById('productDiscount').value = draft.productDiscount || '';
    document.getElementById('productStock').value = draft.productStock || '';
    document.getElementById('productWeight').value = draft.productWeight || '';
    document.getElementById('productColor').value = draft.productColor || '';
    document.getElementById('productSize').value = draft.productSize || '';
    document.getElementById('productMaterial').value = draft.productMaterial || '';
    document.getElementById('productTags').value = draft.productTags || '';

    if (draft.images) {
        productImages = draft.images;
        renderImagePreviews();
    }
}

// Utility Functions
function generateId() {
    return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function clearForm() {
    productForm.reset();
    productImages = [];
    renderImagePreviews();
    localStorage.removeItem('productDraft');
}

function closeModal() {
    editProductModal.classList.remove('show');
    document.body.style.overflow = '';
    editingProductId = null;
}

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export/Import Functions
function exportProducts() {
    const data = JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_export.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Products exported successfully!');
}

function importProducts(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedProducts = JSON.parse(e.target.result);
            if (Array.isArray(importedProducts)) {
                products = [...products, ...importedProducts];
                saveProducts();
                renderProducts();
                updateStats();
                showToast(`Imported ${importedProducts.length} products successfully!`);
            }
        } catch (error) {
            showToast('Invalid file format');
        }
    };
    reader.readAsText(file);
}

// Make functions globally available
window.removeImage = removeImage;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.exportProducts = exportProducts;
window.importProducts = importProducts;

