from rest_framework import serializers
from .models import Order, OrderItem
from django.contrib.auth import get_user_model

User = get_user_model()


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice items (OrderItem model)"""
    product_id = serializers.CharField(source='product.id', read_only=True, allow_null=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product_name', 'quantity', 
            'unit_price', 'discount_amount', 'tax_rate', 
            'tax_amount', 'total'
        ]
        read_only_fields = ['id', 'tax_amount', 'total']


class PaymentSerializer(serializers.Serializer):
    """Serializer for payment records (simplified, as Payment model might not exist yet)"""
    id = serializers.CharField(read_only=True)
    invoice_id = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    method = serializers.CharField()
    reference = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)


class CustomerSerializer(serializers.Serializer):
    """Simplified customer serializer for nested representation"""
    id = serializers.CharField()
    name = serializers.CharField()
    phone = serializers.CharField()
    email = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    gst_number = serializers.CharField(required=False, allow_blank=True)


class InvoiceSerializer(serializers.ModelSerializer):
    """Main invoice serializer using Order model"""
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True, allow_null=True)
    discount_type = serializers.CharField(default='fixed')
    
    class Meta:
        model = Order
        fields = [
            'id', 'branch_id', 'customer_id', 'customer', 
            'invoice_number', 'invoice_type', 'items',
            'subtotal', 'discount_amount', 'discount_type',
            'tax_amount', 'total', 'paid_amount', 'status',
            'notes', 'payments', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'organization_id', 'created_by', 'created_at', 'invoice_number']


class CreateInvoiceSerializer(serializers.Serializer):
    """Serializer for creating invoices with items"""
    customer_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    invoice_type = serializers.CharField(default='sale')
    items = serializers.ListField(child=serializers.DictField())
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_type = serializers.CharField(default='fixed')
    notes = serializers.CharField(required=False, allow_blank=True)
    payments = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )


class InvoiceStatsSerializer(serializers.Serializer):
    """Serializer for invoice statistics"""
    total_count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    partial_count = serializers.IntegerField()
    draft_count = serializers.IntegerField()
    cancelled_count = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_outstanding = serializers.DecimalField(max_digits=12, decimal_places=2)


# Keep original serializers for backward compatibility
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('organization_id', 'created_by')
