import json
import razorpay
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import Order
from .serializers import OrderSerializer

@api_view(['POST'])
def start_payment(request):
    # request.data is coming from frontend
    amount = request.data.get('amount')

    if not amount or float(amount) <= 0:
        return Response({'error': 'Invalid amount'}, status=400)

    # Setup razorpay client
    client = razorpay.Client(auth=(settings.RAZORPAY_PUBLIC_KEY, settings.RAZORPAY_SECRET_KEY))

    # Create razorpay order (amount in paise)
    payment = client.order.create({
        "amount": int(float(amount) * 100),
        "currency": "INR",
        "payment_capture": "1"
    })

    # Save order with isPaid=False
    order = Order.objects.create(
        order_amount=amount,
        order_payment_id=payment['id'],
        order_product=request.data.get('product_name', '')  # Optional product name
    )

    serializer = OrderSerializer(order)

    data = {
        "payment": payment,
        "order": serializer.data
    }
    return Response(data)

@api_view(['POST'])
def handle_payment_success(request):
    # request.data is coming from frontend
    res = json.loads(request.data["response"])

    ord_id = res.get('razorpay_order_id')
    raz_pay_id = res.get('razorpay_payment_id')
    raz_signature = res.get('razorpay_signature')

    if not all([ord_id, raz_pay_id, raz_signature]):
        return Response({'error': 'Missing payment details'}, status=400)

    # Get order by payment_id
    try:
        order = Order.objects.get(order_payment_id=ord_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    # Verify payment signature
    client = razorpay.Client(auth=(settings.RAZORPAY_PUBLIC_KEY, settings.RAZORPAY_SECRET_KEY))
    data = {
        'razorpay_order_id': ord_id,
        'razorpay_payment_id': raz_pay_id,
        'razorpay_signature': raz_signature
    }

    try:
        client.utility.verify_payment_signature(data)
        order.isPaid = True
        order.save()
        return Response({'message': 'Payment successfully received!'})
    except razorpay.errors.SignatureVerificationError:
        return Response({'error': 'Payment verification failed'}, status=400)