from rest_framework import serializers, viewsets
from .models import Category, SubCategory, Product, Order, OrderItem, Review, ProductImage, ShippingAddress, WishlistItem, ReviewImage, UserProfile, Address

# Serializers
class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug', 'description', 'image']

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
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'price', 'image', 'category', 
                 'average_rating', 'review_count', 'sizes', 'in_stock']

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'size', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='orderitem_set', many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'created_at', 'updated_at',
            'shipping_address', 'shipping_city', 'shipping_postal_code', 'shipping_country',
            'payment_method', 'payment_details', 'subtotal', 'shipping_cost', 'total',
            'items'
        ]

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
    user = serializers.StringRelatedField(read_only=True)
    user_email = serializers.SerializerMethodField()
    images = ReviewImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'user_email', 'title', 'content', 
                 'rating', 'created_at', 'is_verified_purchase', 'images', 'uploaded_images']
        read_only_fields = ['user', 'is_verified_purchase', 'created_at']
    
    def get_user_email(self, obj):
        # Return first letter of email + asterisks for privacy
        email = obj.user.email
        if email:
            username, domain = email.split('@')
            masked_username = username[0] + '*' * (len(username) - 1)
            return f"{masked_username}@{domain}"
        return ""
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        user = self.context['request'].user
        
        # Check if this is a verified purchase
        order_items = OrderItem.objects.filter(
            order__user=user, 
            product_id=validated_data['product'].id,
            order__status='completed'
        )
        is_verified = order_items.exists()
        
        review = Review.objects.create(
            user=user,
            is_verified_purchase=is_verified,
            **validated_data
        )
        
        # Create review images
        for image in uploaded_images:
            ReviewImage.objects.create(review=review, image=image)
            
        return review

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = ['id', 'first_name', 'last_name', 'address', 'city', 
                  'postal_code', 'country', 'is_default', 'created_at']
        read_only_fields = ['created_at']

class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    
    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'added_at']

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
