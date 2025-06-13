# filepath: /home/eren/Desktop/cloths-store/backend/store/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, OrderViewSet,
    ReviewViewSet, BulkProductUploadView, ShippingAddressViewSet,
    WishlistViewSet, UserProfileViewSet, AddressViewSet,
    UserReviewViewSet, UserViewSet  # Make sure to import UserViewSet
)

# Create router for API endpoints
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'shipping-addresses', ShippingAddressViewSet, basename='shipping-address')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'users/profile', UserProfileViewSet, basename='user-profile')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'reviews/my-reviews', UserReviewViewSet, basename='user-review')

# Add non-viewset API endpoints
urlpatterns = [
    path('users/profile/', UserProfileViewSet.as_view({
        'get': 'me',
        'put': 'me'
    }), name='user-profile'),
    path('bulk-upload/', BulkProductUploadView.as_view(), name='bulk-upload'),
    path('users/me/', UserViewSet.as_view({'get': 'me', 'put': 'me'}), name='user-me'),  # Explicit path for user-me
]

# Add router URLs
urlpatterns += router.urls