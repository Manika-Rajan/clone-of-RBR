from django.urls import path
from . import views

urlpatterns = [
    path('pay/', views.start_payment, name='start_payment'),
    path('payment/success/', views.handle_payment_success, name='handle_payment_success'),
]