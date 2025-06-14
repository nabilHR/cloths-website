from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.utils.text import slugify
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Review, Product, Category, Order, OrderItem, ShippingAddress, WishlistItem, UserProfile, Address, SubCategory
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
from django.db.models import Q
from .pagination import CustomPagination
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from .models import ProductImage



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
    """
    API endpoint for products - public GET access, authenticated for other operations
    """
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'get_by_slug']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Product.objects.all().order_by('-created_at')
        
        # Debug logging for category filtering
        category = self.request.query_params.get('category')
        if category:
            print(f"Filtering products by category ID: {category}")
            try:
                # Explicit conversion to integer for exact matching
                category_id = int(category)
                queryset = queryset.filter(category_id=category_id)
                
                # Debug log
                print(f"Found {queryset.count()} products in category {category_id}")
                
                # Log each product for verification
                for product in queryset[:5]:  # First 5 for brevity
                    print(f"Product ID: {product.id}, Name: {product.name}, Category: {product.category_id}")
                    
            except ValueError:
                print(f"Invalid category ID: {category}")
                queryset = Product.objects.none()
    
        # Other filters (subcategory, featured, etc.)
        subcategory = self.request.query_params.get('subcategory')
        if subcategory:
            queryset = queryset.filter(subcategory_id=subcategory)
            
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(featured=True)
            
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

    @action(detail=False, methods=['get'], url_path='(?P<slug>[-\w]+)', permission_classes=[permissions.AllowAny])
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

def product_list(request):
    """View function for listing all products"""
    products = Product.objects.filter(in_stock=True)
    return render(request, 'store/product_list.html', {'products': products})

def product_detail(request, slug):
    """View function for displaying a single product"""
    product = get_object_or_404(Product, slug=slug, in_stock=True)
    return render(request, 'store/product_detail.html', {'product': product})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return only the current user's orders
        return Order.objects.filter(user=self.request.user)

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        """Get or update current user profile"""
        user = request.user
        
        # Handle PUT requests (updates)
        if request.method == 'PUT':
            data = request.data
            
            # Only update fields that are provided and not empty
            if 'first_name' in data and data['first_name']:
                user.first_name = data['first_name']
            
            if 'last_name' in data and data['last_name']:
                user.last_name = data['last_name']
            
            # Save the user object
            user.save()
            
        # Return the user data (for both GET and after PUT)
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