from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from store.views import CategoryViewSet, ProductViewSet, OrderViewSet, RegisterView
from store.views import BulkProductUploadView

# Create a single router instance
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet, basename='order')  # basename is required here

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('MyAuth/', include('MyAuth.urls')),
    path('api/bulk-products/', BulkProductUploadView.as_view(), name='bulk-products'),

]

# Static files for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)