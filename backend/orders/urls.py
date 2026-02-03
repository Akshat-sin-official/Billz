from django.urls import path
from .views import CreateOrderView, CreatePaymentIntentView, OrderListView

urlpatterns = [
    path('create/', CreateOrderView.as_view(), name='order_create'),
    path('list/', OrderListView.as_view(), name='order_list'),
    path('payment-intent/', CreatePaymentIntentView.as_view(), name='payment_intent'),
]
