from rest_framework import serializers, viewsets
from .models import Category, SubCategory, Product, Order, OrderItem, Review, ProductImage, ShippingAddress, WishlistItem, ReviewImage, UserProfile, Address

# Serializers
class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug', 'category', 'description', 'image']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'subcategories']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class ProductSerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    # Add category name for easier debugging
    category_name = serializers.SerializerMethodField()
    
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None
    
    # Add robust error handling to the to_representation method
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Handle sizes field with better error handling
        try:
            # Ensure sizes is always an array
            if 'sizes' in data:
                if data['sizes'] is None:
                    data['sizes'] = []  # Handle None values
                elif isinstance(data['sizes'], str):
                    # If sizes is stored as a string, convert to array
                    if data['sizes'].strip():  # Check if string is not empty
                        if (data['sizes'].strip().startswith('[') and 
                            data['sizes'].strip().endswith(']')):
                            try:
                                # If it's already JSON formatted
                                import json
                                data['sizes'] = json.loads(data['sizes'])
                            except Exception:
                                # Fallback to comma splitting
                                data['sizes'] = [size.strip() for size in data['sizes'].split(',')]
                        else:
                            # Simple comma splitting
                            data['sizes'] = [size.strip() for size in data['sizes'].split(',')]
                    else:
                        data['sizes'] = []  # Handle empty strings
                elif not isinstance(data['sizes'], list):
                    # Convert any other type to a list with a single item
                    data['sizes'] = [str(data['sizes'])]
            else:
                # If sizes field doesn't exist, add it as an empty array
                data['sizes'] = []
        except Exception as e:
            # Fallback to empty array if any error occurs during conversion
            print(f"Error processing sizes for product {instance.id if hasattr(instance, 'id') else 'unknown'}: {str(e)}")
            data['sizes'] = []
        
        return data
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'sale_price',
            'category', 'subcategory', 'in_stock', 'sizes', 'colors',
            'image', 'featured', 'average_rating', 'review_count',
            'created_at', 'updated_at', 'sku', 'category_name'
        ]

class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    size = serializers.CharField(allow_blank=True, required=False)
    color = serializers.CharField(allow_blank=True, required=False)
    # Add these fields:
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()

    def get_product_name(self, obj):
        return obj.product.name if obj.product else ""

    def get_product_image(self, obj):
        return obj.product.image.url if obj.product and obj.product.image else ""

    def get_product_price(self, obj):
        return str(obj.product.price) if obj.product else ""

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user']  # Make user read-only

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not user.is_authenticated:
            raise serializers.ValidationError({"user": ["Authentication required."]})

        items_data = validated_data.pop('items')
        shipping_address_data = validated_data.pop('shipping_address_data', None)

        # Set shipping fields from shipping_address_data if provided
        if shipping_address_data:
            validated_data['shipping_address'] = shipping_address_data.get('address', '')
            validated_data['shipping_city'] = shipping_address_data.get('city', '')
            validated_data['shipping_postal_code'] = shipping_address_data.get('zip_code', '')
            validated_data['shipping_country'] = shipping_address_data.get('country', '')

        # Set the user here!
        validated_data['user'] = user

        order = Order.objects.create(**validated_data)

        subtotal = 0
        for item_data in items_data:
            product_id = item_data.get('product_id') or item_data.get('product')
            if not product_id:
                raise serializers.ValidationError("Each item must have a product_id.")
            product = Product.objects.get(id=product_id)
            price = product.sale_price if product.sale_price else product.price

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                size=item_data.get('size', ''),
                color=item_data.get('color', ''),
                price=price
            )
            subtotal += price * item_data['quantity']

        order.subtotal = subtotal
        order.total = subtotal
        order.save()

        return order
from django.contrib.auth.models import User
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user


# Add to your serializers.py
class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']

class ReviewSerializer(serializers.ModelSerializer):
    # user_name will be serialized for GET requests, but not expected in POST/PUT data.
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    # The 'user' field (ForeignKey to User model) will be populated by the view's perform_create method.
    # It should be included in 'fields' if you want to see the user ID in the response,
    # but it MUST be marked as read-only for input.

    class Meta:
        model = Review
        fields = [
            'id', 
            'product', 
            'user',         # Included for outputting the user ID
            'user_name',    # Included for outputting the username
            'rating', 
            'title', 
            'content', 
            'created_at'
        ]
        # 'user' is made read-only here. This means if 'user' is present in the POST data,
        # it will be ignored during deserialization, so serializer.validated_data will not contain 'user'.
        # 'created_at' and 'user_name' are also inherently read-only due to their nature or explicit setting.
        read_only_fields = ('user', 'created_at', 'user_name')

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = ['id', 'first_name', 'last_name', 'address', 'city', 
                  'postal_code', 'country', 'is_default', 'created_at']
        read_only_fields = ['created_at']

class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True) # Product details for GET, read-only for input
    
    class Meta:
        model = WishlistItem
        fields = ['id', 'user', 'product', 'added_at']
        read_only_fields = ('user', 'added_at') # User will be set from request

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'profile_picture', 'phone_number']
        read_only_fields = ['user']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'user', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country', 'is_default']
        read_only_fields = ['user']

# ViewSets
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().prefetch_related('subcategories')
    serializer_class = CategorySerializer

class SubCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset
