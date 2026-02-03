import stripe
import os
from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

class CreateOrderView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class CreatePaymentIntentView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            amount = request.data.get('amount')
            currency = request.data.get('currency', 'usd')

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            return Response({
                'clientSecret': intent.client_secret
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
