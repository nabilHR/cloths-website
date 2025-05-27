from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    ProductViewSet, 
    OrderViewSet,
    ReviewViewSet,  # Now you can include this
    BulkProductUploadView,
    ShippingAddressViewSet,  # Include the ShippingAddressViewSet
    WishlistViewSet  # Include the WishlistViewSet
)

# Create a router for store app endpoints
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')  # Uncomment this
router.register(r'shipping-addresses', ShippingAddressViewSet, basename='shipping-address')  # Register the new viewset
router.register(r'wishlist', WishlistViewSet, basename='wishlist')  # Register the Wishlist viewset

# Define URL patterns
urlpatterns = [
    # Include all router-generated URLs
    path('', include(router.urls)),
    
    # Custom endpoints that don't fit the REST pattern
    path('bulk-products/', BulkProductUploadView.as_view(), name='bulk-products'),
]