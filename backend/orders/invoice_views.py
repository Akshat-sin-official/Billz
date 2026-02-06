import uuid
from decimal import Decimal
from datetime import datetime
from django.db import transaction
from django.db.models import Sum, Q, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order, OrderItem
from .serializers import (
    InvoiceSerializer, CreateInvoiceSerializer, 
    InvoiceStatsSerializer, PaymentSerializer
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for invoice operations (using Order model)
    Provides: list, retrieve, create, update, and custom actions
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter invoices by user's organization"""
        queryset = Order.objects.filter(
            organization_id=self.request.user.organization_id
        ).prefetch_related('items').order_by('-created_at')
        
        # Apply filters
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(invoice_number__icontains=search) |
                Q(customer_id__icontains=search) |
                Q(notes__icontains=search)
            )
        
        invoice_status = self.request.query_params.get('status', None)
        if invoice_status:
            queryset = queryset.filter(status=invoice_status)
        
        invoice_type = self.request.query_params.get('invoice_type', None)
        if invoice_type:
            queryset = queryset.filter(invoice_type=invoice_type)
        
        customer_id = self.request.query_params.get('customer_id', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new invoice with items and optional payments"""
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        items_data = data.pop('items', [])
        payments_data = data.pop('payments', [])
        
        # Generate invoice number
        invoice_number = self._generate_invoice_number()
        
        # Calculate totals
        subtotal = Decimal('0')
        total_tax = Decimal('0')
        
        # Process items to calculate totals
        processed_items = []
        for item_data in items_data:
            quantity = Decimal(str(item_data.get('quantity', 1)))
            unit_price = Decimal(str(item_data.get('unit_price', 0)))
            discount = Decimal(str(item_data.get('discount_amount', 0)))
            
            item_subtotal = (quantity * unit_price) - discount
            # Assuming 18% GST for now (could be configurable)
            tax_rate = Decimal('18')
            tax_amount = item_subtotal * tax_rate / Decimal('100')
            item_total = item_subtotal + tax_amount
            
            processed_items.append({
                **item_data,
                'tax_rate': tax_rate,
                'tax_amount': tax_amount,
                'total': item_total
            })
            
            subtotal += item_subtotal
            total_tax += tax_amount
        
        discount_amount = Decimal(str(data.get('discount_amount', 0)))
        total = subtotal + total_tax
        
        # Calculate paid amount from payments
        paid_amount = sum(Decimal(str(p.get('amount', 0))) for p in payments_data)
        
        # Determine status
        if paid_amount == 0:
            order_status = 'draft'
        elif paid_amount >= total:
            order_status = 'completed'
        else:
            order_status = 'partial'
        
        # Create order (invoice)
        order = Order.objects.create(
            organization_id=request.user.organization_id,
            created_by=request.user,
            branch_id=data.get('branch_id', ''),
            customer_id=data.get('customer_id', ''),
            invoice_number=invoice_number,
            invoice_type=data.get('invoice_type', 'sale'),
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=total_tax,
            total=total,
            paid_amount=paid_amount,
            status=order_status,
            notes=data.get('notes', '')
        )
        
        # Create order items
        for item_data in processed_items:
            OrderItem.objects.create(
                order=order,
                product_id=item_data.get('product_id'),
                product_name=item_data.get('product_name', ''),
                quantity=item_data.get('quantity'),
                unit_price=item_data.get('unit_price'),
                discount_amount=item_data.get('discount_amount', 0),
                tax_rate=item_data.get('tax_rate', 0),
                tax_amount=item_data.get('tax_amount', 0),
                total=item_data.get('total')
            )
        
        # Note: Payments would be stored in a Payment model if it exists
        # For now, we'll just track paid_amount in the Order
        
        response_serializer = InvoiceSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to an existing invoice"""
        invoice = self.get_object()
        
        amount = Decimal(str(request.data.get('amount', 0)))
        method = request.data.get('method', 'cash')
        reference = request.data.get('reference', '')
        
        # Update paid amount
        invoice.paid_amount += amount
        
        # Update status based on payment
        if invoice.paid_amount >= invoice.total:
            invoice.status = 'completed'
        elif invoice.paid_amount > 0:
            invoice.status = 'partial'
        
        invoice.save()
        
        # Note: If Payment model exists, create payment record here
        
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an invoice"""
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        
        invoice.status = 'cancelled'
        if reason:
            invoice.notes = f"{invoice.notes}\nCancelled: {reason}" if invoice.notes else f"Cancelled: {reason}"
        invoice.save()
        
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics for the organization"""
        queryset = Order.objects.filter(
            organization_id=request.user.organization_id
        )
        
        total_count = queryset.count()
        completed_count = queryset.filter(status='completed').count()
        partial_count = queryset.filter(status='partial').count()
        draft_count = queryset.filter(status='draft').count()
        cancelled_count = queryset.filter(status='cancelled').count()
        
        # Calculate revenue (completed + partial payments)
        revenue_data = queryset.filter(
            status__in=['completed', 'partial']
        ).aggregate(
            total_revenue=Sum('paid_amount'),
            total_billed=Sum('total')
        )
        
        total_revenue = revenue_data['total_revenue'] or Decimal('0')
        total_billed = revenue_data['total_billed'] or Decimal('0')
        total_outstanding = total_billed - total_revenue
        
        stats_data = {
            'total_count': total_count,
            'completed_count': completed_count,
            'partial_count': partial_count,
            'draft_count': draft_count,
            'cancelled_count': cancelled_count,
            'total_revenue': total_revenue,
            'total_outstanding': total_outstanding,
        }
        
        serializer = InvoiceStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate invoice totals (server-side calculation)"""
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        items_data = data.get('items', [])
        
        # Calculate totals
        subtotal = Decimal('0')
        total_tax = Decimal('0')
        
        for item_data in items_data:
            quantity = Decimal(str(item_data.get('quantity', 1)))
            unit_price = Decimal(str(item_data.get('unit_price', 0)))
            discount = Decimal(str(item_data.get('discount_amount', 0)))
            
            item_subtotal = (quantity * unit_price) - discount
            tax_rate = Decimal('18')  # Default GST
            tax_amount = item_subtotal * tax_rate / Decimal('100')
            
            subtotal += item_subtotal
            total_tax += tax_amount
        
        total = subtotal + total_tax
        
        return Response({
            'valid': True,
            'calculated_subtotal': subtotal,
            'calculated_tax': total_tax,
            'calculated_total': total,
        })
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send invoice via email (placeholder for future implementation)"""
        invoice = self.get_object()
        email = request.data.get('email', '')
        
        # TODO: Implement email sending logic
        # For now, just return success
        
        return Response({
            'message': f'Invoice {invoice.invoice_number} would be sent to {email}',
            'success': True
        })
    
    def _generate_invoice_number(self):
        """Generate a unique invoice number"""
        # Format: INV-YYYYMMDD-XXXX
        today = datetime.now().strftime('%Y%m%d')
        
        # Count invoices created today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        count = Order.objects.filter(
            created_at__gte=today_start,
            organization_id=self.request.user.organization_id
        ).count() + 1
        
        return f"INV-{today}-{count:04d}"
