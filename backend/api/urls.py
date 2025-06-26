from django.urls import path
from . import views

urlpatterns = [
    path('razorpay/pay/', views.start_payment, name='start_payment'),
    path('razorpay/payment/success/', views.handle_payment_success, name='handle_payment_success'),
]