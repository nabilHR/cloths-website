from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    ProductViewSet, 
    OrderViewSet,
    ReviewViewSet,  # Now you can include this
    BulkProductUploadView,
    ShippingAddressViewSet,  # Include the ShippingAddressViewSet
    WishlistViewSet,  # Include the WishlistViewSet
    UserProfileViewSet,  # Include the UserProfileViewSet
    AddressViewSet,  # Include the AddressViewSet
    UserReviewViewSet  # Include the UserReviewViewSet
)
from . import views  # Add this import

# Create a router for store app endpoints
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')  # Uncomment this
router.register(r'shipping-addresses', ShippingAddressViewSet, basename='shipping-address')  # Register the new viewset
router.register(r'wishlist', WishlistViewSet, basename='wishlist')  # Register the Wishlist viewset
router.register(r'users/profile', UserProfileViewSet, basename='user-profile')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'reviews/my-reviews', UserReviewViewSet, basename='user-review')

# Define URL patterns
urlpatterns = [
    # Main app URLs
    path('products/', views.product_list, name='product_list'),
    path('products/<slug:slug>/', views.product_detail, name='product_detail'),
    
    # Admin URLs
    path('admin/products/fancy-upload/', views.fancy_product_upload, name='fancy_product_upload'),
    path('admin/products/create/', views.product_create, name='product_create'),
]