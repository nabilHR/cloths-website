
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from .serializers import RegisterSerializer, CategorySerializer, ProductSerializer, OrderSerializer
from .models import Category, Product, Order, OrderItem

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# Remove the first OrderViewSet definition (keep this as a comment)
# class OrderViewSet(viewsets.ModelViewSet):
#     queryset = Order.objects.all()
#     serializer_class = OrderSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": serializer.data},
            status=status.HTTP_201_CREATED,
        )

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter orders by the current user
        return Order.objects.filter(user=self.request.user)
    
    def create(self, request):
        # Extract data from request
        items_data = request.data.get('items', [])
        shipping_data = request.data.get('shipping', {})
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            status='pending'
        )
        
        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                size=item_data['size']
            )
        
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
# Add this to your existing views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.utils.text import slugify
from django.db import transaction
import json
import os
import uuid

class BulkProductUploadView(APIView):
    permission_classes = [IsAuthenticated]      
    @transaction.atomic
    def post(self, request):
        try:
            # Get product data from form
            products_data = json.loads(request.data.get('products', '[]'))
            
            if not products_data:
                return Response({'detail': 'No product data provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process uploaded images
            image_files = {}
            for key, file in request.FILES.items():
                if key.startswith('image_'):
                    image_files[key] = file
            
            created_products = []
            
            for i, product_data in enumerate(products_data):
                # Validate required fields
                if not product_data.get('name') or not product_data.get('price'):
                    continue
                
                # Generate slug if not provided
                if not product_data.get('slug'):
                    product_data['slug'] = slugify(product_data['name'])
                
                # Ensure slug uniqueness
                base_slug = product_data['slug']
                suffix = 1
                while Product.objects.filter(slug=product_data['slug']).exists():
                    product_data['slug'] = f"{base_slug}-{suffix}"
                    suffix += 1
                
                # Create product
                product = Product.objects.create(
                    name=product_data['name'],
                    slug=product_data['slug'],
                    description=product_data.get('description', ''),
                    price=product_data['price'],
                    category_id=product_data.get('category'),
                    sizes=product_data.get('sizes', ['S', 'M', 'L']),
                    in_stock=True
                )
                
                # Assign image to product if available
                image_key = f'image_{i}'
                if image_key in image_files:
                    product.image = image_files[image_key]
                    product.save()
                
                # Additional images (if available)
                for j in range(len(image_files)):
                    extra_image_key = f'image_{j}'
                    if extra_image_key in image_files and extra_image_key != image_key:
                        ProductImage.objects.create(
                            product=product,
                            image=image_files[extra_image_key]
                        )
                
                created_products.append(product.id)
            
            return Response({
                'message': f'Successfully created {len(created_products)} products',
                'product_ids': created_products
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)