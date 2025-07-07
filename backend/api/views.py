import json
import razorpay
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer

@csrf_exempt
@api_view(['POST'])
def start_payment(request):
    amount = request.data.get('amount')
    print(f"Creating order with amount: {amount}, type: {type(amount)}")
    try:
        amount_float = float(amount)
        if amount_float < 1:
            print("Error: Amount must be at least 1 INR")
            return Response({'error': 'Amount must be at least 1 INR'}, status=400)
    except (TypeError, ValueError) as e:
        print(f"Error converting amount to float: {str(e)}")
        return Response({'error': 'Invalid amount format'}, status=400)
    
    client = razorpay.Client(auth=(settings.RAZORPAY_PUBLIC_KEY, settings.RAZORPAY_SECRET_KEY))
    payment = client.order.create({
        "amount": int(amount_float * 100),
        "currency": "INR",
        "payment_capture": "1"
    })
    print(f"Created Razorpay order: {payment['id']}")
    
    order = Order.objects.create(
        order_amount=amount_float,
        order_payment_id=payment['id'],
        order_product=request.data.get('product_name', 'Business Report')
    )
    print(f"Saved order: {order.id}, order_amount type: {type(order.order_amount)}")
    
    serializer = OrderSerializer(order)
    data = {"payment": payment, "order": serializer.data}
    return Response(data)

@csrf_exempt
@api_view(['POST'])
def handle_payment_success(request):
    try:
        response = request.data.get('response')
        print(f"Received response: {response}")
        if not response:
            print("Error: No response data provided")
            return Response({'error': 'No response data provided'}, status=400)
        
        params_dict = json.loads(response)
        print(f"Parsed params_dict: {params_dict}")
        if not all(key in params_dict for key in ['razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature']):
            print("Error: Missing required payment fields")
            return Response({'error': 'Missing required payment fields'}, status=400)
        
        client = razorpay.Client(auth=(settings.RAZORPAY_PUBLIC_KEY, settings.RAZORPAY_SECRET_KEY))
        print(f"Verifying signature with keys: {settings.RAZORPAY_PUBLIC_KEY}, {settings.RAZORPAY_SECRET_KEY[:4]}...")
        client.utility.verify_payment_signature({
            'razorpay_payment_id': params_dict['razorpay_payment_id'],
            'razorpay_order_id': params_dict['razorpay_order_id'],
            'razorpay_signature': params_dict['razorpay_signature']
        })
        
        print(f"Looking for order with payment_id: {params_dict['razorpay_order_id']}")
        order = Order.objects.get(order_payment_id=params_dict['razorpay_order_id'])
        print(f"Found order: {order}, order_amount: {order.order_amount}, type: {type(order.order_amount)}")
        order.isPaid = True
        order.save()
        print("Payment verified and order updated")
        return Response({'message': 'payment successfully received!'})
    except razorpay.errors.SignatureVerificationError as e:
        print(f"Signature verification failed: {str(e)}")
        return Response({'error': 'Signature verification failed'}, status=400)
    except Order.DoesNotExist:
        print(f"Order not found for payment_id: {params_dict['razorpay_order_id']}")
        return Response({'error': 'Order not found'}, status=400)
    except Exception as e:
        print(f"Payment verification error: {str(e)}")
        return Response({'error': f'Payment verification failed: {str(e)}'}, status=400)