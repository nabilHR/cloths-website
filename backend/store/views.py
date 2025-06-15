from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.utils.text import slugify
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Review, Product, Category, Order, OrderItem, ShippingAddress, WishlistItem, UserProfile, Address, SubCategory, ProductImage
from .serializers import (
    RegisterSerializer, 
    CategorySerializer, 
    ProductSerializer, 
    OrderSerializer,
    ReviewSerializer,
    ShippingAddressSerializer,
    WishlistItemSerializer,
    UserProfileSerializer,
    AddressSerializer,
    SubCategorySerializer
)
import json
import os
import uuid
import traceback
import stripe
from django.db.models import Q
from .pagination import CustomPagination
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

def calculate_order_total(order_data):
    """Calculate the total amount for an order including shipping and tax"""
    # If the client sends the pre-calculated amount, use that
    if 'amount' in order_data and order_data['amount']:
        return float(order_data['amount'])
    
    # Otherwise calculate from order_id
    if 'order_id' in order_data:
        try:
            order = Order.objects.get(id=order_data['order_id'])
            return float(order.total)
        except Order.DoesNotExist:
            raise ValueError(f"Order with ID {order_data['order_id']} not found")
    
    # If neither amount nor order_id provided, calculate from items
    subtotal = 0
    items = order_data.get('items', [])
    
    for item in items:
        product_id = item.get('product_id') or item.get('product')
        quantity = item.get('quantity', 1)
        
        try:
            product = Product.objects.get(id=product_id)
            price = float(product.sale_price or product.price)
            subtotal += price * quantity
        except Product.DoesNotExist:
            print(f"Product {product_id} not found")
    
    # Add shipping and tax
    shipping = 0.00  # Free shipping
    tax = subtotal * 0.1  # 10% tax
    
    return subtotal + shipping + tax

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Category.objects.all()
        
        # Add slug filtering
        slug = self.request.query_params.get('slug')
        if slug:
            queryset = queryset.filter(slug=slug)
            print(f"Filtering categories by slug: {slug}")
    
        # Debug information
        print(f"Returning {queryset.count()} categories")
        for cat in queryset:
            print(f"  - {cat.name} (ID: {cat.id}, slug: {cat.slug})")
            
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for products
    """
    serializer_class = ProductSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, filters.SearchFilter] 
    ordering_fields = ['created_at', 'price', 'name'] 
    ordering = ['-created_at'] 

    # CONSOLIDATED get_permissions (ensure the other definition is removed from your file)
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'create']:
            if self.action == 'create':
                 return [permissions.IsAuthenticated()]
            return [permissions.IsAdminUser()] 
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = Product.objects.all() \
                                 .select_related('category') \
                                 .prefetch_related('images')
        
        # Get category parameter and apply filtering by category ID
        category_param = self.request.query_params.get('category')
        if category_param:
            try:
                category_id = int(category_param)
                print(f"Filtering products by category ID: {category_id}")
                queryset = queryset.filter(category_id=category_id)
                print(f"Found {queryset.count()} products in category {category_id}")
            except (ValueError, TypeError):
                print(f"Invalid category ID: {category_param}")
                return Product.objects.none()
        
        # Size filtering - FIXED VERSION
        size_param = self.request.query_params.get('size')
        if size_param:
            print(f"Filtering products by size: {size_param}")
            
            # Use a more flexible approach with Q objects to handle different data formats
            from django.db.models import Q
            
            size_query = (
                Q(sizes__contains=[size_param]) |  # For JSONField/ArrayField with exact array items
                Q(sizes__contains=size_param) |     # For JSONField with string within JSON
                Q(sizes__icontains=f'"{size_param}"') |  # For JSONField with quoted strings
                Q(sizes__icontains=f',{size_param},') |  # For comma-separated list in the middle
                Q(sizes__istartswith=f'{size_param},') | # For comma-separated list at start
                Q(sizes__iendswith=f',{size_param}') |   # For comma-separated list at end
                Q(sizes__iexact=size_param)              # For exact match (single size)
            )
            
            queryset = queryset.filter(size_query)
            print(f"Found {queryset.count()} products with size {size_param}")
    
        # Filter by featured status
        featured_param = self.request.query_params.get('featured')
        if featured_param and featured_param.lower() == 'true':
            queryset = queryset.filter(featured=True)
            
        # Handle sorting
        sort_by_param = self.request.query_params.get('sort_by')
        if sort_by_param == 'newest':
            queryset = queryset.order_by('-created_at') 
        elif sort_by_param == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_by_param == 'price_desc':
            queryset = queryset.order_by('-price')
        elif not sort_by_param and not self.request.query_params.get('ordering'):
            # Default ordering if no specific sort_by or DRF 'ordering' param is provided
            queryset = queryset.order_by('-created_at')
        # Note: If 'rest_framework.filters.OrderingFilter' is active (which it is in your filter_backends),
        # it will also look for an 'ordering' query parameter. The logic here for 'sort_by'
        # can coexist or you might choose to rely solely on OrderingFilter.

        # Price range filtering
        min_price_param = self.request.query_params.get('min_price')
        max_price_param = self.request.query_params.get('max_price')
        if min_price_param:
            try:
                queryset = queryset.filter(price__gte=float(min_price_param))
            except ValueError:
                print(f"Invalid min_price parameter: {min_price_param}")
        if max_price_param:
            try:
                queryset = queryset.filter(price__lte=float(max_price_param))
            except ValueError:
                print(f"Invalid max_price parameter: {max_price_param}")
        
        print(f"Final queryset count before pagination: {queryset.count()}")
        return queryset
        
    # Add explicit delete method to ensure it works
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"detail": f"Error deleting product: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path=r'(?P<slug>[-\w]+)', permission_classes=[permissions.AllowAny])
    def get_by_slug(self, request, slug=None):
        """Get a product by its slug"""
        try:
            product = Product.objects.get(slug=slug)
            serializer = self.get_serializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    # Default ModelViewSet provides GET (single), PUT, PATCH, DELETE for /api/products/{id}/
    # You might override update for complex image handling:
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # --- Example: Basic image handling ---
        # If you send 'images_to_delete' (list of image IDs)
        images_to_delete_ids = request.data.get('images_to_delete', [])
        if images_to_delete_ids:
            ProductImage.objects.filter(id__in=images_to_delete_ids, product=instance).delete()

        # If you send 'new_images' (list of new image files)
        # This part is more complex with DRF serializers and file uploads.
        # Often, new images are handled by creating new ProductImage instances.
        # The ProductSerializer might need to be adjusted to accept nested writes for new images
        # or you handle it explicitly here.

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been used, ensure it's reset.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()
        # Potentially handle new image uploads here if not done by serializer
        # For example, if request.FILES contains new images:
        # new_images_files = self.request.FILES.getlist('new_images_files_field_name')
        # product_instance = serializer.instance
        # for img_file in new_images_files:
        # ProductImage.objects.create(product=product_instance, image=img_file)


    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """Search products by query term"""
        q = request.query_params.get('q', '')
        if not q:
            return Response({"detail": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = Product.objects.filter(
            Q(name__icontains=q) | 
            Q(description__icontains=q) |
            Q(category__name__icontains=q)
        ).select_related('category').prefetch_related('images')
        
        # Apply regular pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # Return non-paginated response if pagination is disabled
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='search-suggestions')
    def search_suggestions(self, request):
        """Get search suggestions for autocomplete"""
        q = request.query_params.get('q', '')
        if not q or len(q) < 2:  # Require at least 2 characters for suggestions
            return Response([])
        
        # Get product name suggestions
        product_suggestions = Product.objects.filter(
            name__icontains=q
        ).values_list('name', flat=True).distinct()[:5]
        
        # Get category suggestions
        category_suggestions = Category.objects.filter(
            name__icontains=q
        ).values_list('name', flat=True).distinct()[:3]
        
        # Combine suggestions
        suggestions = list(product_suggestions) + list(category_suggestions)
        
        # Limit to top 8 suggestions
        suggestions = suggestions[:8]
        
        return Response(suggestions)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        User = get_user_model()
        
        # Get user data from request
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        # Validate required fields
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create token for user
        token, created = Token.objects.get_or_create(user=user)
        
        # Return user data and token
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined.isoformat(),
            'profile': {
                'phone_number': user.profile.phone_number if hasattr(user, 'profile') else None,
                # Add other profile fields as needed
            } if hasattr(user, 'profile') else None
        }
        
        return Response({
            'user': user_data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
#start
# In store/views.py

# DELETE your entire old OrderViewSet and REPLACE it with this:

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return orders for the current user!
        return Order.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
# NOTE: The two duplicate "def create(...)" methods are now gone. 
# The serializer will handle the creation logic.
# ende here
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
                    except Category.DoesNotExist:
                        category = Category.objects.first()
                        print(f"Category not found, using: {category.name}")
                    
                    # Get subcategory if provided
                    subcategory = None
                    subcategory_id = product_data.get('subcategory')
                    if subcategory_id:
                        try:
                            subcategory = SubCategory.objects.get(
                                id=subcategory_id, 
                                category=category
                            )
                        except SubCategory.DoesNotExist:
                            # Subcategory doesn't exist or doesn't belong to the category
                            pass
                    
                    # Create product
                    product = Product.objects.create(
                        name=product_data['name'],
                        slug=product_data['slug'],
                        description=product_data.get('description', ''),
                        price=float(product_data['price']),
                        sale_price=product_data.get('sale_price'),
                        category=category,
                        subcategory=subcategory,  # Add subcategory
                        sizes=product_data.get('sizes', []),
                        colors=product_data.get('colors', []),
                        featured=product_data.get('featured', False),
                        in_stock=product_data.get('in_stock', True),
                        sku=product_data.get('sku', '')
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
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Or appropriate permissions

    def perform_create(self, serializer):
        # This is the standard DRF way to associate the current user.
        # It passes 'user=self.request.user' as an additional keyword argument to serializer.save().
        serializer.save(user=self.request.user)

    def get_queryset(self):
        # Your existing queryset logic for filtering by product_id
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

class ShippingAddressViewSet(viewsets.ModelViewSet):
    serializer_class = ShippingAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ShippingAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the wishlist items
        for the currently authenticated user.
        """
        return WishlistItem.objects.filter(user=self.request.user).select_related('product')

    def perform_create(self, serializer):
        """
        Associate the wishlist item with the current authenticated user.
        Expects 'product_id' in request.data.
        """
        product_id = self.request.data.get('product_id')
        if not product_id:
            # Using DRF's validation handling is cleaner if product_id is part of serializer
            # For now, manual check:
            return Response({'product_id': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'product_id': ['Invalid product.']}, status=status.HTTP_404_NOT_FOUND)
        
        if WishlistItem.objects.filter(user=self.request.user, product=product).exists():
            # Optionally, you could return the existing item or just a specific status/message
            existing_item = WishlistItem.objects.get(user=self.request.user, product=product)
            serializer_instance = self.get_serializer(existing_item)
            return Response(serializer_instance.data, status=status.HTTP_200_OK) # Or status.HTTP_409_CONFLICT

        serializer.save(user=self.request.user, product=product)

    @action(detail=False, methods=['get'], url_path='check/(?P<product_pk>[^/.]+)')
    def check_product_in_wishlist(self, request, product_pk=None):
        """
        Check if a specific product is in the current user's wishlist.
        """
        try:
            product = Product.objects.get(pk=product_pk)
            wishlist_item = WishlistItem.objects.filter(user=request.user, product=product).first()
            if wishlist_item:
                return Response({
                    'in_wishlist': True, 
                    'wishlist_item_id': wishlist_item.id,
                    'product_id': product.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({'in_wishlist': False, 'product_id': product.id}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Log the exception e for debugging
            print(f"Error in check_product_in_wishlist: {str(e)}")
            return Response({'detail': 'An error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name
        })
    
    @action(detail=False, methods=['put'])
    def me(self, request):
        """Update current user's profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

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
    from .forms import ProductForm, ProductImageFormSet

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        image_formset = ProductImageFormSet(request.POST, request.FILES, prefix='images')
        if form.is_valid() and image_formset.is_valid():
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
def product_list(request):
    """View function for listing all products"""
    products = Product.objects.filter(in_stock=True)
    return render(request, 'store/product_list.html', {'products': products})
def product_detail(request, slug):
    """View function for displaying a single product"""
    product = get_object_or_404(Product, slug=slug, in_stock=True)
    return render(request, 'store/product_detail.html', {'product': product})
    return render(request, 'store/product_list.html', {'products': products})

# (Remove the corrupted duplicate OrderViewSet and define UserViewSet properly)

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer  # Or a custom User serializer if you have one

    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        """Get or update current user profile"""
        user = request.user
        if request.method == 'PUT':
            data = request.data
            if 'first_name' in data and data['first_name']:
                user.first_name = data['first_name']
            if 'last_name' in data and data['last_name']:
                user.last_name = data['last_name']
            user.save()
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'bio': getattr(user.profile, 'bio', None) if hasattr(user, 'profile') else None,
            'profile_picture': getattr(user.profile, 'profile_picture', None) if hasattr(user, 'profile') else None,
            'phone_number': getattr(user.profile, 'phone_number', None) if hasattr(user, 'profile') else None,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        })
# Fix the SubCategoryViewSet
class SubCategoryViewSet(viewsets.ModelViewSet):
    """API endpoint for subcategories"""
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.AllowAny]  # Public access

    def get_queryset(self):
        queryset = SubCategory.objects.all()
        # Filter by slug if provided
        slug = self.request.query_params.get('slug')
        if slug:
            queryset = queryset.filter(slug=slug)
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        return queryset

# Add this to your Django views.py for better error handling
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    try:
        # Log the incoming data for debugging
        print("Review data received:", request.data)
        
        # Create a modified version with the current user
        data = request.data.copy()
        data['user'] = request.user.id
        
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Log the exception for debugging
        print("Error creating review:", str(e))
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Create a PaymentIntent with Stripe"""
    try:
        # Get order details from request
        order_data = request.data
        
        # Calculate amount in the smallest currency unit (cents for USD)
        amount = calculate_order_total(order_data)
        amount_cents = int(amount * 100)
        
        # Create a PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            metadata={
                'user_id': request.user.id,
                'order_id': order_data.get('order_id')
            },
        )
        
        return Response({
            'client_secret': intent.client_secret
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle the event
    if event.type == 'payment_intent.succeeded':
        payment_intent = event.data.object
        order_id = payment_intent.metadata.get('order_id')
        
        # Update order status
        try:
            order = Order.objects.get(id=order_id)
            order.status = 'paid'
            
            # Save payment details
            order.payment_method = 'credit_card'
            order.payment_details = {
                'payment_id': payment_intent.id,
                'amount': payment_intent.amount / 100,  # Convert cents to dollars
                'last_four': payment_intent.payment_method_details.card.last4,
                'brand': payment_intent.payment_method_details.card.brand,
            }
            
            order.save()
        except Order.DoesNotExist:
            return Response({'error': f'Order {order_id} not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response({'status': 'success'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        print("Received order data:", request.data)
        # Your existing code...
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Serializer errors:", serializer.errors)  # Add this for debugging
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print("Order creation error:", str(e))  # Add this for debugging
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)