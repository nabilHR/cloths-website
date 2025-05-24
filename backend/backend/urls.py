from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from store.views import CategoryViewSet, ProductViewSet, OrderViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)

from rest_framework.authtoken.views import obtain_auth_token
from store.views import RegisterView              # <-- add

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/register/', RegisterView.as_view()), # <-- add
    path('api/auth/login/', obtain_auth_token),         # <-- add
    path('MyAuth/', include('MyAuth.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
