from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    ProductViewSet, 
    OrderViewSet,
    ReviewViewSet,
    BulkProductUploadView,
    ShippingAddressViewSet,
    WishlistViewSet,
    UserProfileViewSet,
    AddressViewSet,
    UserReviewViewSet
)
from . import views

# Create a router for REST API endpoints
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
router.register(r'subcategories', views.SubCategoryViewSet, basename='subcategory')

# Define URL patterns
urlpatterns = [
    # REST API endpoints
    path('api/', include(router.urls)),
    
    # Traditional Django views (template-based)
    path('products/', views.product_list, name='product_list'),
    path('products/<slug:slug>/', views.product_detail, name='product_detail'),
    
    # Admin URLs
    path('admin/products/fancy-upload/', views.fancy_product_upload, name='fancy_product_upload'),
    path('admin/products/create/', views.product_create, name='product_create'),
]