from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, AddStaffSerializer
from .permissions import IsOwnerOrManager

User = get_user_model()

class AddStaffView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrManager)
    serializer_class = AddStaffSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Staff member added successfully'
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class StaffListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrManager)

    def get_queryset(self):
        return User.objects.filter(organization_id=self.request.user.organization_id)
