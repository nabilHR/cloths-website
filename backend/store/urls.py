from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    ProductViewSet, 
    OrderViewSet,
    ReviewViewSet,  # Now you can include this
    BulkProductUploadView
)

# Create a router for store app endpoints
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')  # Uncomment this

# Define URL patterns
urlpatterns = [
    # Include all router-generated URLs
    path('', include(router.urls)),
    
    # Custom endpoints that don't fit the REST pattern
    path('bulk-products/', BulkProductUploadView.as_view(), name='bulk-products'),
]