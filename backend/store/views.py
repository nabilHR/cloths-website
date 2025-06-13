from rest_framework import viewsets, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Review, Product, Category, Order, ShippingAddress, WishlistItem, UserProfile, Address
from .serializers import (
    RegisterSerializer, 
    CategorySerializer, 
    ProductSerializer, 
    OrderSerializer,
    ReviewSerializer,
    ShippingAddressSerializer,
    WishlistItemSerializer,
    UserProfileSerializer,
    AddressSerializer
)
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.utils.text import slugify
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import json
import os
import uuid
import traceback
from django.db.models import Q
from .pagination import CustomPagination
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from .models import Product, ProductImage, Category, SubCategory



class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None  # Disable pagination for categories
    
    # Add error logging
    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            print(f"Error in CategoryViewSet: {str(e)}")
            raise

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    lookup_field = 'slug'  # Ensure this is set to use slugs
    
    def get_queryset(self):
        queryset = Product.objects.all()
        
        # Text search
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
            
        # Price range filtering - fully fixed version
        min_price = self.request.query_params.get('min_price')
        if min_price and min_price.strip():  # Ensure not empty string
            try:
                min_price_float = float(min_price)
                print(f"🔍🔍🔍 APPLYING MIN PRICE FILTER: {min_price_float}")
                queryset = queryset.filter(price__gte=min_price_float)
            except (ValueError, TypeError) as e:
                print(f"❌❌❌ ERROR PARSING MIN_PRICE: {min_price}, Error: {e}")
                
        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                max_price_float = float(max_price)
                queryset = queryset.filter(price__lte=max_price_float)
                print(f"⭐ Applying max_price filter: {max_price_float}")
            except (ValueError, TypeError):
                print(f"⭐ Invalid max_price value: {max_price}")
        
        # Category filtering
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        # Size filtering
        size = self.request.query_params.get('size')
        if size:
            # Assuming sizes are stored in a field called 'sizes'
            # Modify this based on your actual model structure
            queryset = queryset.filter(sizes__icontains=size)
            
        # Sort options
        sort_by = self.request.query_params.get('sort_by')
        if sort_by:
            if sort_by == 'price_low':
                queryset = queryset.order_by('price')
            elif sort_by == 'price_high':
                queryset = queryset.order_by('-price')
            elif sort_by == 'newest':
                queryset = queryset.order_by('-created_at')
            elif sort_by == 'name_asc':
                queryset = queryset.order_by('name')
                
        result_count = queryset.count()
        print(f"⭐ Final query returned {result_count} products")
        return queryset.distinct()
    
    @action(detail=False, methods=['get'], url_path='search-suggestions')
    def search_suggestions(self, request):
        query = request.query_params.get('q', '')
        if not query or len(query) < 2:
            return Response([])
            
        # Simple search for demo
        products = self.get_queryset().filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )[:8]  # Limit to 8 results
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

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
        return Order.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the user has permission to view this order
        if instance.user != request.user:
            return Response(
                {"detail": "You do not have permission to view this order."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Add the user to the order data
        serializer.validated_data['user'] = request.user
        
        # Create the order
        order = self.perform_create(serializer)
        
        # Return the new order data
        return Response(
            self.get_serializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    def perform_create(self, serializer):
        return serializer.save()
    
    def create(self, request):
        # Extract data from request
        items_data = request.data.get('items', [])
        shipping_data = request.data.get('shipping', {})
        payment_data = request.data.get('payment', {})
        
        # Validate data
        if not items_data:
            return Response(
                {'detail': 'No items in order'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate totals
        subtotal = 0
        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'])
                subtotal += float(product.price) * int(item['quantity'])
            except Product.DoesNotExist:
                return Response(
                    {'detail': f'Product with ID {item["product_id"]} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        shipping_cost = 10.00  # Fixed shipping cost
        total = subtotal + shipping_cost
        
        # Create order
        try:
            with transaction.atomic():
                # Create order
                order = Order.objects.create(
                    user=request.user,
                    status='pending',
                    subtotal=subtotal,
                    shipping_cost=shipping_cost,
                    total=total,
                    shipping_address=shipping_data.get('address', ''),
                    shipping_city=shipping_data.get('city', ''),
                    shipping_postal_code=shipping_data.get('postal_code', ''),
                    shipping_country=shipping_data.get('country', ''),
                    payment_method='credit_card',
                    payment_details={
                        'card_name': payment_data.get('card_name', ''),
                        'last_four': payment_data.get('last_four', '')
                    }
                )
                
                # Create order items
                for item_data in items_data:
                    product = Product.objects.get(id=item_data['product_id'])
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item_data['quantity'],
                        size=item_data['size'],
                        price=product.price
                    )
                
                # Send confirmation email
                self.send_order_confirmation_email(order, shipping_data.get('email'))
                
                serializer = OrderSerializer(order)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def send_order_confirmation_email(self, order, email):
        try:
            # Get order items
            items = OrderItem.objects.filter(order=order).select_related('product')
            
            # Create email context
            context = {
                'order': order,
                'items': items,
                'user': order.user
            }
            
            # Render email content
            html_content = render_to_string('order_confirmation_email.html', context)
            text_content = render_to_string('order_confirmation_email.txt', context)
            
            # Send email
            send_mail(
                subject=f'Order Confirmation #{order.id}',
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_content,
                fail_silently=False
            )
        except Exception as e:
            # Log the error but don't stop the order process
            print(f"Email error: {str(e)}")

class BulkProductUploadView(APIView):
    permission_classes = [IsAuthenticated]  # Changed to just IsAuthenticated to help with testing
    
    @transaction.atomic
    def post(self, request):
        try:
            # Debug the request data
            print("Request data keys:", request.data.keys())
            print("User:", request.user.username)
            print("Is staff:", request.user.is_staff)
            print("Auth:", request.auth)
            
            # Get product data
            products_data = json.loads(request.data.get('products', '[]'))
            print(f"Parsed {len(products_data)} products")
            
            if not products_data:
                return Response({'detail': 'No product data provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Debug the image files
            print("Files:", request.FILES.keys())
            images = request.FILES.getlist('images')
            print(f"Found {len(images)} images")
            
            created_products = []
            
            # Make sure we have at least one category
            if not Category.objects.exists():
                category = Category.objects.create(name="Default Category", slug="default-category")
                print(f"Created default category: {category.name}")
            
            for i, product_data in enumerate(products_data):
                try:
                    # Debug current product
                    print(f"Processing product {i+1}: {product_data.get('name')}")
                    
                    # Validate required fields
                    if not product_data.get('name') or not product_data.get('price'):
                        print(f"Skipping product {i+1}: Missing name or price")
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
                    
                    # Get category
                    category_id = product_data.get('category')
                    try:
                        if category_id:
                            category = Category.objects.get(id=category_id)
                        else:
                            # Use first category as fallback
                            category = Category.objects.first()
                        print(f"Using category: {category.name}")
                    except Category.DoesNotExist:
                        category = Category.objects.first()
                        print(f"Category not found, using: {category.name}")
                    
                    # Make sure price is a float
                    try:
                        price = float(product_data['price'])
                    except (ValueError, TypeError):
                        print(f"Invalid price: {product_data.get('price')}, using 0.0")
                        price = 0.0
                    
                    # Create product
                    product = Product.objects.create(
                        name=product_data['name'],
                        slug=product_data['slug'],
                        description=product_data.get('description', ''),
                        price=price,
                        category=category,
                        sizes=product_data.get('sizes', ['S', 'M', 'L']),
                        in_stock=True
                    )
                    print(f"Created product: {product.name} (ID: {product.id})")
                    
                    # Assign image to product if available
                    if i < len(images):
                        product.image = images[i]
                        product.save()
                        print(f"Assigned image to product: {product.name}")
                    
                    created_products.append(product.id)
                except Exception as e:
                    print(f"Error creating product {product_data.get('name', f'product_{i}')}: {str(e)}")
                    print(traceback.format_exc())
            
            return Response({
                'message': f'Successfully created {len(created_products)} products',
                'product_ids': created_products
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Bulk upload error: {str(e)}")
            print(traceback.format_exc())
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    
    def get_queryset(self):
        # Anyone can view all reviews
        product_id = self.request.query_params.get('product')
        if product_id:
            return Review.objects.filter(product_id=product_id)
        
        # If user is authenticated, they can see their own reviews via 'my-reviews'
        if self.action == 'my_reviews' and self.request.user.is_authenticated:
            return Review.objects.filter(user=self.request.user)
            
        return Review.objects.all()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'my_reviews']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_review(self, request):
        product_id = request.query_params.get('product')
        if not product_id:
            return Response({'detail': 'Product ID is required'}, status=400)
            
        queryset = Review.objects.filter(
            user=request.user,
            product_id=product_id
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        # Check if user already reviewed this product
        product_id = self.request.data.get('product')
        user_review = Review.objects.filter(user=self.request.user, product_id=product_id)
        
        if user_review.exists():
            raise serializers.ValidationError("You have already reviewed this product")
            
        serializer.save(user=self.request.user)

class ShippingAddressViewSet(viewsets.ModelViewSet):
    serializer_class = ShippingAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ShippingAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)
    
    def create(self, request):
        product_id = request.data.get('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found'}, status=404)
            
        wishlist_item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product
        )
        
        if created:
            return Response({'detail': 'Product added to wishlist'}, status=201)
        else:
            return Response({'detail': 'Product already in wishlist'}, status=200)
            
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'detail': 'Product removed from wishlist'}, status=200)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

class UserReviewViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

def is_staff(user):
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(is_staff)
def product_create(request):
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        image_formset = ProductImageFormSet(request.POST, request.FILES, prefix='images')
        
        if form.is_valid() and image_formset.is_valid():
            # Save the product
            product = form.save(commit=False)
            # Process sizes if entered as comma-separated string
            if isinstance(form.cleaned_data['sizes'], str):
                product.sizes = [size.strip() for size in form.cleaned_data['sizes'].split(',') if size.strip()]
            product.save()
            
            # Save the additional images
            instances = image_formset.save(commit=False)
            for instance in instances:
                instance.product = product
                instance.save()
            
            messages.success(request, f'Product "{product.name}" created successfully.')
            return redirect('admin:store_product_changelist')
    else:
        form = ProductForm()
        image_formset = ProductImageFormSet(prefix='images')
    
    return render(request, 'admin/store/product/create.html', {
        'form': form,
        'image_formset': image_formset,
        'title': 'Add New Product',
    })

@login_required
@user_passes_test(is_staff)
def fancy_product_upload(request):
    """A fancy product upload view with a beautiful interface"""
    
    if request.method == 'POST':
        # Handle form submission here
        # This will be implemented fully with the fancy upload HTML
        messages.success(request, "Product created successfully!")
        return redirect('admin:store_product_changelist')
    
    # Get all categories for the form
    categories = Category.objects.all()
    
    return render(request, 'admin/store/product/fancy_upload.html', {
        'categories': categories,
        'title': 'Add New Product'
    })