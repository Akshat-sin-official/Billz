from django.urls import path
from .views import CreateOrderView, CreatePaymentIntentView

urlpatterns = [
    path('create/', CreateOrderView.as_view(), name='order_create'),
    path('payment-intent/', CreatePaymentIntentView.as_view(), name='payment_intent'),
]
