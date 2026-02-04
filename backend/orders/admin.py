from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'quantity', 'unit_price', 'discount_amount', 'tax_rate', 'tax_amount', 'total')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'created_by', 'total', 'paid_amount', 'status', 'created_at', 'organization_id')
    list_filter = ('status', 'invoice_type', 'organization_id', 'created_at')
    search_fields = ('invoice_number', 'customer_id', 'organization_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('invoice_number', 'invoice_type', 'status', 'organization_id', 'branch_id')
        }),
        ('Customer & Staff', {
            'fields': ('created_by', 'customer_id')
        }),
        ('Financial Details', {
            'fields': ('subtotal', 'discount_amount', 'tax_amount', 'total', 'paid_amount')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_at')
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product_name', 'quantity', 'unit_price', 'total')
    list_filter = ('order__status', 'order__created_at')
    search_fields = ('product_name', 'order__invoice_number')
    readonly_fields = ('order', 'product', 'product_name', 'quantity', 'unit_price', 'discount_amount', 'tax_rate', 'tax_amount', 'total')
